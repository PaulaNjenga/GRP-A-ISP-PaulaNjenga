"""
PCOS Risk Prediction Model Training Script

This script trains a machine learning model to predict PCOS risk based on:
- β-hCG I (Beta-human chorionic gonadotropin - 1st measurement)
- β-hCG II (Beta-human chorionic gonadotropin - 2nd measurement)  
- AMH (Anti-Müllerian Hormone)
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
import joblib
import json
from datetime import datetime
import os

# Create directories
os.makedirs('models', exist_ok=True)
os.makedirs('data', exist_ok=True)

def load_data(filepath='data/pcos_data.csv'):
    """
    Load PCOS training data from CSV file.
    
    Expected columns:
    - beta_hcg_i: First β-hCG measurement (mIU/mL)
    - beta_hcg_ii: Second β-hCG measurement (mIU/mL)
    - amh: Anti-Müllerian Hormone (ng/mL)
    - pcos: Target variable (0 = No PCOS, 1 = PCOS)
    """
    try:
        df = pd.read_csv(filepath)
        print(f"✓ Data loaded successfully: {df.shape[0]} samples, {df.shape[1]} features")
        print(f"\nDataset Info:")
        print(df.info())
        print(f"\nFirst few rows:")
        print(df.head())
        return df
    except FileNotFoundError:
        print(f"✗ Error: Data file not found at {filepath}")
        print("\nCreating sample dataset for demonstration...")
        return create_sample_data()

def create_sample_data(n_samples=1000):
    """
    Create synthetic PCOS dataset for demonstration.
    Replace this with your actual data!
    """
    np.random.seed(42)
    
    # Generate synthetic data
    # PCOS positive cases (40%)
    n_pcos = int(n_samples * 0.4)
    pcos_data = {
        'beta_hcg_i': np.random.normal(120, 40, n_pcos),  # Higher β-hCG
        'beta_hcg_ii': np.random.normal(250, 60, n_pcos),  # Higher β-hCG
        'amh': np.random.normal(5.5, 1.5, n_pcos),  # Higher AMH (>4.0 indicates PCOS)
        'pcos': np.ones(n_pcos)
    }
    
    # PCOS negative cases (60%)
    n_normal = n_samples - n_pcos
    normal_data = {
        'beta_hcg_i': np.random.normal(60, 20, n_normal),  # Normal β-hCG
        'beta_hcg_ii': np.random.normal(140, 30, n_normal),  # Normal β-hCG
        'amh': np.random.normal(2.5, 0.8, n_normal),  # Normal AMH (<3.0)
        'pcos': np.zeros(n_normal)
    }
    
    # Combine datasets
    df_pcos = pd.DataFrame(pcos_data)
    df_normal = pd.DataFrame(normal_data)
    df = pd.concat([df_pcos, df_normal], ignore_index=True)
    
    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Ensure positive values
    df['beta_hcg_i'] = df['beta_hcg_i'].clip(lower=0)
    df['beta_hcg_ii'] = df['beta_hcg_ii'].clip(lower=0)
    df['amh'] = df['amh'].clip(lower=0)
    
    print(f"✓ Created synthetic dataset: {df.shape[0]} samples")
    print(f"  - PCOS positive: {(df['pcos'] == 1).sum()} ({(df['pcos'] == 1).mean()*100:.1f}%)")
    print(f"  - PCOS negative: {(df['pcos'] == 0).sum()} ({(df['pcos'] == 0).mean()*100:.1f}%)")
    
    # Save sample data
    df.to_csv('data/pcos_sample_data.csv', index=False)
    print(f"✓ Sample data saved to data/pcos_sample_data.csv")
    
    return df

def preprocess_data(df):
    """Preprocess the data: handle missing values, feature engineering, etc."""
    print("\n" + "="*60)
    print("PREPROCESSING DATA")
    print("="*60)
    
    # Check for missing values
    missing = df.isnull().sum()
    if missing.any():
        print(f"\n⚠ Missing values found:")
        print(missing[missing > 0])
        df = df.dropna()
        print(f"✓ Dropped rows with missing values. Remaining: {len(df)}")
    else:
        print("✓ No missing values found")
    
    # Feature engineering
    df['hcg_ratio'] = df['beta_hcg_ii'] / (df['beta_hcg_i'] + 1)  # Avoid division by zero
    df['hcg_difference'] = df['beta_hcg_ii'] - df['beta_hcg_i']
    df['hcg_sum'] = df['beta_hcg_i'] + df['beta_hcg_ii']
    
    print(f"\n✓ Created engineered features:")
    print(f"  - hcg_ratio: β-hCG II / β-hCG I")
    print(f"  - hcg_difference: β-hCG II - β-hCG I")
    print(f"  - hcg_sum: β-hCG I + β-hCG II")
    
    # Statistics
    print(f"\nFeature Statistics:")
    print(df.describe())
    
    return df

def train_models(X_train, X_test, y_train, y_test):
    """Train multiple models and select the best one."""
    print("\n" + "="*60)
    print("TRAINING MODELS")
    print("="*60)
    
    models = {
        'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
        'Random Forest': RandomForestClassifier(random_state=42, n_estimators=100),
        'Gradient Boosting': GradientBoostingClassifier(random_state=42, n_estimators=100)
    }
    
    results = {}
    
    for name, model in models.items():
        print(f"\nTraining {name}...")
        
        # Train model
        model.fit(X_train, y_train)
        
        # Predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        # Metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred)
        recall = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        
        # Cross-validation
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc')
        
        results[name] = {
            'model': model,
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'roc_auc': roc_auc,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std()
        }
        
        print(f"  Accuracy:  {accuracy:.4f}")
        print(f"  Precision: {precision:.4f}")
        print(f"  Recall:    {recall:.4f}")
        print(f"  F1 Score:  {f1:.4f}")
        print(f"  ROC-AUC:   {roc_auc:.4f}")
        print(f"  CV Score:  {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    
    # Select best model based on ROC-AUC
    best_model_name = max(results, key=lambda x: results[x]['roc_auc'])
    best_model = results[best_model_name]['model']
    
    print(f"\n{'='*60}")
    print(f"BEST MODEL: {best_model_name}")
    print(f"{'='*60}")
    
    return best_model, best_model_name, results

def evaluate_model(model, X_test, y_test, feature_names):
    """Detailed model evaluation."""
    print("\n" + "="*60)
    print("MODEL EVALUATION")
    print("="*60)
    
    # Predictions
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    # Classification Report
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['No PCOS', 'PCOS']))
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    print("\nConfusion Matrix:")
    print(f"                 Predicted")
    print(f"                 No    Yes")
    print(f"Actual No    {cm[0][0]:5d} {cm[0][1]:5d}")
    print(f"Actual Yes   {cm[1][0]:5d} {cm[1][1]:5d}")
    
    # Feature Importance (if available)
    if hasattr(model, 'feature_importances_'):
        print("\nFeature Importance:")
        importances = pd.DataFrame({
            'feature': feature_names,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
        print(importances.to_string(index=False))
    
    return y_pred, y_pred_proba

def save_model(model, scaler, feature_names, metadata):
    """Save the trained model and associated artifacts."""
    print("\n" + "="*60)
    print("SAVING MODEL")
    print("="*60)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save model
    model_path = f'models/pcos_model_{timestamp}.joblib'
    joblib.dump(model, model_path)
    print(f"✓ Model saved: {model_path}")
    
    # Save scaler
    scaler_path = f'models/scaler_{timestamp}.joblib'
    joblib.dump(scaler, scaler_path)
    print(f"✓ Scaler saved: {scaler_path}")
    
    # Save metadata
    metadata_path = f'models/metadata_{timestamp}.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"✓ Metadata saved: {metadata_path}")
    
    # Save latest versions (for easy loading)
    joblib.dump(model, 'models/pcos_model_latest.joblib')
    joblib.dump(scaler, 'models/scaler_latest.joblib')
    
    metadata['model_path'] = 'models/pcos_model_latest.joblib'
    metadata['scaler_path'] = 'models/scaler_latest.joblib'
    
    with open('models/metadata_latest.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✓ Latest versions saved for production use")
    
    return model_path, scaler_path, metadata_path

def main():
    """Main training pipeline."""
    print("\n" + "="*60)
    print("PCOS RISK PREDICTION MODEL TRAINING")
    print("="*60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Load data
    df = load_data('data/pcos_data.csv')
    
    # Preprocess
    df = preprocess_data(df)
    
    # Prepare features and target
    feature_cols = ['beta_hcg_i', 'beta_hcg_ii', 'amh', 'hcg_ratio', 'hcg_difference', 'hcg_sum']
    X = df[feature_cols]
    y = df['pcos']
    
    print(f"\n✓ Features: {feature_cols}")
    print(f"✓ Target: pcos (0=No PCOS, 1=PCOS)")
    print(f"✓ Total samples: {len(X)}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"✓ Train set: {len(X_train)} samples")
    print(f"✓ Test set: {len(X_test)} samples")
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    print(f"✓ Features scaled using StandardScaler")
    
    # Train models
    best_model, best_model_name, all_results = train_models(
        X_train_scaled, X_test_scaled, y_train, y_test
    )
    
    # Evaluate best model
    y_pred, y_pred_proba = evaluate_model(
        best_model, X_test_scaled, y_test, feature_cols
    )
    
    # Prepare metadata
    metadata = {
        'model_name': best_model_name,
        'features': feature_cols,
        'training_date': datetime.now().isoformat(),
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'metrics': {
            'accuracy': float(all_results[best_model_name]['accuracy']),
            'precision': float(all_results[best_model_name]['precision']),
            'recall': float(all_results[best_model_name]['recall']),
            'f1_score': float(all_results[best_model_name]['f1']),
            'roc_auc': float(all_results[best_model_name]['roc_auc']),
            'cv_mean': float(all_results[best_model_name]['cv_mean']),
            'cv_std': float(all_results[best_model_name]['cv_std'])
        },
        'feature_ranges': {
            'beta_hcg_i': {'min': float(df['beta_hcg_i'].min()), 'max': float(df['beta_hcg_i'].max())},
            'beta_hcg_ii': {'min': float(df['beta_hcg_ii'].min()), 'max': float(df['beta_hcg_ii'].max())},
            'amh': {'min': float(df['amh'].min()), 'max': float(df['amh'].max())}
        }
    }
    
    # Save model
    model_path, scaler_path, metadata_path = save_model(
        best_model, scaler, feature_cols, metadata
    )
    
    print("\n" + "="*60)
    print("TRAINING COMPLETE!")
    print("="*60)
    print(f"\nModel Performance:")
    print(f"  Accuracy:  {metadata['metrics']['accuracy']:.4f}")
    print(f"  Precision: {metadata['metrics']['precision']:.4f}")
    print(f"  Recall:    {metadata['metrics']['recall']:.4f}")
    print(f"  F1 Score:  {metadata['metrics']['f1_score']:.4f}")
    print(f"  ROC-AUC:   {metadata['metrics']['roc_auc']:.4f}")
    print(f"\nFiles saved:")
    print(f"  - {model_path}")
    print(f"  - {scaler_path}")
    print(f"  - {metadata_path}")
    print(f"\nReady for deployment! Use 'models/*_latest.joblib' files in Flask app.")

if __name__ == '__main__':
    main()
