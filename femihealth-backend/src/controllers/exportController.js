import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';
import Prediction from '../models/Prediction.js';
import path from 'path';
import fs from 'fs';

// @desc    Export prediction report as PDF
// @route   GET /api/export/pdf/:reportId
// @access  Private
export const exportPDF = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.reportId)
      .populate('user', 'name email');

    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    // Check authorization
    if (
      prediction.user._id.toString() !== req.user._id.toString() &&
      !['admin', 'doctor'].includes(req.user.role)
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create PDF
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prediction-${prediction._id}.pdf`);

    doc.pipe(res);

    // Add content
    doc.fontSize(20).text('FemiHealth - Prediction Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Report ID: ${prediction._id}`);
    doc.text(`Date: ${prediction.createdAt.toLocaleDateString()}`);
    doc.text(`Patient: ${prediction.user.name}`);
    doc.moveDown();

    doc.fontSize(16).text('Prediction Results');
    doc.moveDown();
    doc.fontSize(12).text(`Prediction: ${prediction.result.prediction.toUpperCase()}`);
    doc.text(`Confidence: ${(prediction.result.confidence * 100).toFixed(2)}%`);
    doc.text(`Risk Level: ${prediction.result.riskLevel}`);
    doc.moveDown();

    if (prediction.recommendations && prediction.recommendations.length > 0) {
      doc.fontSize(16).text('Recommendations');
      doc.moveDown();
      prediction.recommendations.forEach((rec, index) => {
        doc.fontSize(12).text(`${index + 1}. ${rec.title} (${rec.priority})`);
        doc.fontSize(10).text(`   ${rec.description}`);
        doc.moveDown(0.5);
      });
    }

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Export data as CSV
// @route   GET /api/export/csv/:dataType
// @access  Private
export const exportCSV = async (req, res) => {
  try {
    const { dataType } = req.params;

    if (dataType !== 'predictions') {
      return res.status(400).json({ message: 'Invalid data type' });
    }

    const predictions = await Prediction.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    // Create CSV data
    const csvData = predictions.map(p => ({
      id: p._id.toString(),
      date: p.createdAt.toISOString(),
      type: p.type,
      prediction: p.result.prediction,
      confidence: p.result.confidence,
      riskLevel: p.result.riskLevel,
      status: p.status,
    }));

    // Convert to CSV string
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=predictions-${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Export dashboard data
// @route   GET /api/export/dashboard
// @access  Private
export const exportDashboard = async (req, res) => {
  try {
    const format = req.query.format || 'pdf';

    const predictions = await Prediction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    if (format === 'pdf') {
      const doc = new PDFDocument();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=dashboard-${Date.now()}.pdf`);

      doc.pipe(res);

      doc.fontSize(20).text('FemiHealth - Dashboard Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`User: ${req.user.name}`);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      doc.fontSize(16).text('Recent Predictions');
      doc.moveDown();

      predictions.forEach((pred, index) => {
        doc.fontSize(12).text(`${index + 1}. ${pred.createdAt.toLocaleDateString()}`);
        doc.fontSize(10).text(`   Type: ${pred.type}`);
        doc.text(`   Result: ${pred.result.prediction} (${(pred.result.confidence * 100).toFixed(2)}%)`);
        doc.moveDown(0.5);
      });

      doc.end();
    } else {
      res.status(400).json({ message: 'Unsupported format' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
