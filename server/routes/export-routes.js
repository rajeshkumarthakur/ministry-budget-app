// fixed
// server/routes/export-routes.js
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, AlignmentType, WidthType, BorderStyle } = require('docx');

// Initialize with pool from server.js
let pool;
const initializeRouter = (dbPool) => {
  pool = dbPool;
};

// Helper function to get form status display text
const getStatusText = (status) => {
  const statusMap = {
    'draft': 'Draft',
    'pending_pillar': 'Pending Pillar Approval',
    'pending_pastor': 'Pending Pastor Approval',
    'approved': 'Approved',
    'rejected': 'Rejected'
  };
  return statusMap[status] || status;
};

// Helper function to calculate running totals
const calculateRunningTotals = (events) => {
  let runningTotal = 0;
  return events.map(event => {
    runningTotal += parseFloat(event.budget_amount || 0);
    return {
      ...event,
      running_total: runningTotal
    };
  });
};

// GET /api/forms/:id/export/pdf - Export form as PDF
router.get('/:id/export/pdf', async (req, res) => {
  try {
    const { id } = req.params;

    // Get form data
    const formResult = await pool.query(`
      SELECT 
        f.*,
        u.name as created_by_name
      FROM ministry_forms f
      LEFT JOIN users u ON f.ministry_leader_id = u.id
      WHERE f.id = $1
    `, [id]);

    if (formResult.rows.length === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const form = formResult.rows[0];

    // Get form section data from form_data table
    const sectionsResult = await pool.query(
      'SELECT section, data FROM form_data WHERE form_id = $1',
      [id]
    );

    // Build sections object
    const sections = {};
    sectionsResult.rows.forEach(row => {
      sections[row.section] = row.data;
    });

    // Get events
    const eventsResult = await pool.query(
      'SELECT *, estimated_expenses as budget_amount FROM events WHERE form_id = $1 ORDER BY event_date',
      [id]
    );
    const events = eventsResult.rows;
    const eventsWithRunningTotal = calculateRunningTotals(events);

    // Get goals
    const goalsResult = await pool.query(
      'SELECT * FROM goals WHERE form_id = $1 ORDER BY id',
      [id]
    );
    const goals = goalsResult.rows;

    // Calculate totals
    const eventsBudget = events.reduce((sum, e) => sum + parseFloat(e.budget_amount || 0), 0);
    const operatingBudget = parseFloat(sections.section7?.operating_budget || 0);
    const capitalExpenses = parseFloat(sections.section7?.capital_expenses || 0);
    const totalBudget = eventsBudget + operatingBudget + capitalExpenses;

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Form-${form.form_number}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header with logo placeholder and church name
    doc.fontSize(20).font('Helvetica-Bold').text('The Voice Church', 50, 50);
    doc.fontSize(16).font('Helvetica-Bold').text('Ministry Budget & Planning Form', 50, 75);
    // Replace text header with logo
    //doc.image('path/to/church-logo.png', 50, 50, { width: 100 });
    //doc.text('Ministry Budget & Planning Form', 160, 60);
    // Status badge in top right
    const statusText = getStatusText(form.status);
    const statusX = 450;
    doc.fontSize(10).font('Helvetica-Bold');

    // Color-coded status
    if (form.status === 'approved') {
      doc.fillColor('#10b981');
    } else if (form.status === 'rejected') {
      doc.fillColor('#ef4444');
    } else if (form.status === 'pending_pillar' || form.status === 'pending_pastor') {
      doc.fillColor('#f59e0b');
    } else {
      doc.fillColor('#6b7280');
    }

    doc.text(statusText, statusX, 50);
    doc.fillColor('#000000'); // Reset color

    // Form details
    doc.fontSize(10).font('Helvetica');
    doc.text(`Form Number: ${form.form_number}`, 50, 110);
    doc.text(`Ministry: ${form.ministry_name}`, 50, 125);
    doc.text(`Created By: ${form.created_by_name}`, 50, 140);
    doc.text(`Date: ${new Date(form.created_at).toLocaleDateString()}`, 50, 155);

    let yPos = 180;

    // Budget Summary Box (highlighted at top)
    doc.rect(50, yPos, 500, 80).fillAndStroke('#eff6ff', '#3b82f6');
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('TOTAL BUDGET REQUEST', 60, yPos + 10);
    doc.fontSize(24).font('Helvetica-Bold');
    doc.text(`$${totalBudget.toLocaleString()}`, 60, yPos + 35);
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    doc.text(`Events: $${eventsBudget.toLocaleString()}  |  Operating: $${operatingBudget.toLocaleString()}  |  Capital: $${capitalExpenses.toLocaleString()}`, 60, yPos + 65);

    yPos += 100;

    // Section 1: Ministry Information
    if (sections.section1) {
      doc.addPage();
      yPos = 50;
      doc.fontSize(14).font('Helvetica-Bold').text('1. Ministry Information', 50, yPos);
      yPos += 25;
      doc.fontSize(10).font('Helvetica');

      if (sections.section1.leader_name) {
        doc.text(`Leader: ${sections.section1.leader_name}`, 50, yPos);
        yPos += 15;
      }
      if (sections.section1.contact_email) {
        doc.text(`Email: ${sections.section1.contact_email}`, 50, yPos);
        yPos += 15;
      }
      if (sections.section1.contact_phone) {
        doc.text(`Phone: ${sections.section1.contact_phone}`, 50, yPos);
        yPos += 15;
      }
      if (sections.section1.active_members) {
        doc.text(`Active Members: ${sections.section1.active_members}`, 50, yPos);
        yPos += 15;
      }
      if (sections.section1.description) {
        yPos += 10;
        doc.font('Helvetica-Bold').text('Description:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section1.description, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section1.description, { width: 500 }) + 10;
      }
    }

    // Section 2: Mission & Vision
    if (sections.section2) {
      if (yPos > 650) {
        doc.addPage();
        yPos = 50;
      }
      yPos += 20;
      doc.fontSize(14).font('Helvetica-Bold').text('2. Mission & Vision', 50, yPos);
      yPos += 25;
      doc.fontSize(10).font('Helvetica');

      if (sections.section2.mission) {
        doc.font('Helvetica-Bold').text('Mission Statement:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section2.mission, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section2.mission, { width: 500 }) + 15;
      }

      if (sections.section2.vision) {
        doc.font('Helvetica-Bold').text('Vision Statement:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section2.vision, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section2.vision, { width: 500 }) + 15;
      }

      if (sections.section2.values) {
        doc.font('Helvetica-Bold').text('Core Values:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section2.values, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section2.values, { width: 500 }) + 15;
      }
    }

    // Section 3: Programs & Activities
    if (sections.section3) {
      if (yPos > 650) {
        doc.addPage();
        yPos = 50;
      }
      yPos += 20;
      doc.fontSize(14).font('Helvetica-Bold').text('3. Programs & Activities', 50, yPos);
      yPos += 25;
      doc.fontSize(10).font('Helvetica');

      if (sections.section3.current_programs) {
        doc.font('Helvetica-Bold').text('Current Programs:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section3.current_programs, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section3.current_programs, { width: 500 }) + 15;
      }

      if (sections.section3.target_audience) {
        doc.font('Helvetica-Bold').text('Target Audience:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section3.target_audience, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section3.target_audience, { width: 500 }) + 15;
      }

      if (sections.section3.proposed_programs) {
        doc.font('Helvetica-Bold').text('Proposed New Programs:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section3.proposed_programs, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section3.proposed_programs, { width: 500 }) + 15;
      }

      if (sections.section3.meeting_schedule) {
        doc.font('Helvetica-Bold').text('Meeting Schedule:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section3.meeting_schedule, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section3.meeting_schedule, { width: 500 }) + 15;
      }
    }

    // Section 4: Events
    if (events.length > 0) {
      doc.addPage();
      yPos = 50;
      doc.fontSize(14).font('Helvetica-Bold').text(`4. Ministry Events (${events.length})`, 50, yPos);
      yPos += 25;

      // Events table header
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Event Name', 50, yPos);
      doc.text('Date', 200, yPos);
      doc.text('Type', 280, yPos);
      doc.text('Attendees', 360, yPos);
      doc.text('Budget', 430, yPos);
      doc.text('Running Total', 490, yPos, { width: 60, align: 'right' });
      yPos += 15;
      doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
      yPos += 10;

      // Events data
      doc.font('Helvetica').fontSize(9);
      eventsWithRunningTotal.forEach((event, index) => {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        doc.text(event.event_name.substring(0, 25), 50, yPos);
        doc.text(new Date(event.event_date).toLocaleDateString(), 200, yPos);
        doc.text(event.event_type, 280, yPos);
        doc.text(event.expected_attendance.toString(), 360, yPos);
        doc.text(`$${parseFloat(event.budget_amount).toLocaleString()}`, 430, yPos);
        doc.font('Helvetica-Bold').text(`$${event.running_total.toLocaleString()}`, 490, yPos, { width: 60, align: 'right' });
        doc.font('Helvetica');
        yPos += 20;

        if (event.description && event.description.length > 0) {
          doc.fontSize(8).fillColor('#666666');
          doc.text(event.description.substring(0, 100), 70, yPos, { width: 480 });
          doc.fillColor('#000000').fontSize(9);
          yPos += 15;
        }
      });

      // Events total
      yPos += 10;
      doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
      yPos += 10;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Total Events Budget:', 360, yPos);
      doc.text(`$${eventsBudget.toLocaleString()}`, 490, yPos, { width: 60, align: 'right' });
    }

    // Section 5: Goals
    if (goals.length > 0) {
      doc.addPage();
      yPos = 50;
      doc.fontSize(14).font('Helvetica-Bold').text(`5. SMART Goals (${goals.length})`, 50, yPos);
      yPos += 25;

      goals.forEach((goal, index) => {
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`Goal ${index + 1}: ${goal.goal_description}`, 50, yPos);
        yPos += 20;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Specific:', 50, yPos);
        doc.font('Helvetica');
        doc.text(goal.specific, 110, yPos, { width: 440 });
        yPos += doc.heightOfString(goal.specific, { width: 440 }) + 10;

        doc.font('Helvetica-Bold').text('Measurable:', 50, yPos);
        doc.font('Helvetica');
        doc.text(goal.measurable, 110, yPos, { width: 440 });
        yPos += doc.heightOfString(goal.measurable, { width: 440 }) + 10;

        doc.font('Helvetica-Bold').text('Achievable:', 50, yPos);
        doc.font('Helvetica');
        doc.text(goal.achievable, 110, yPos, { width: 440 });
        yPos += doc.heightOfString(goal.achievable, { width: 440 }) + 10;

        doc.font('Helvetica-Bold').text('Relevant:', 50, yPos);
        doc.font('Helvetica');
        doc.text(goal.relevant, 110, yPos, { width: 440 });
        yPos += doc.heightOfString(goal.relevant, { width: 440 }) + 10;

        doc.font('Helvetica-Bold').text('Time-bound:', 50, yPos);
        doc.font('Helvetica');
        doc.text(goal.time_bound, 110, yPos, { width: 440 });
        yPos += doc.heightOfString(goal.time_bound, { width: 440 }) + 25;
      });
    }

    // Section 6: Resources Needed
    if (sections.section6) {
      doc.addPage();
      yPos = 50;
      doc.fontSize(14).font('Helvetica-Bold').text('6. Resources Needed', 50, yPos);
      yPos += 25;
      doc.fontSize(10).font('Helvetica');

      if (sections.section6.personnel_needs) {
        doc.font('Helvetica-Bold').text('Personnel Needs:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section6.personnel_needs, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section6.personnel_needs, { width: 500 }) + 15;
      }

      if (sections.section6.equipment_needs) {
        doc.font('Helvetica-Bold').text('Equipment & Materials:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section6.equipment_needs, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section6.equipment_needs, { width: 500 }) + 15;
      }

      if (sections.section6.facility_needs) {
        doc.font('Helvetica-Bold').text('Facility Requirements:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section6.facility_needs, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section6.facility_needs, { width: 500 }) + 15;
      }

      if (sections.section6.technology_needs) {
        doc.font('Helvetica-Bold').text('Technology & Software:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section6.technology_needs, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section6.technology_needs, { width: 500 }) + 15;
      }

      if (sections.section6.training_needs) {
        doc.font('Helvetica-Bold').text('Training & Development:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section6.training_needs, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section6.training_needs, { width: 500 }) + 15;
      }

      if (sections.section6.other_needs) {
        doc.font('Helvetica-Bold').text('Other Resources:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section6.other_needs, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section6.other_needs, { width: 500 }) + 15;
      }
    }

    // Section 7: Budget Summary
    doc.addPage();
    yPos = 50;
    doc.fontSize(14).font('Helvetica-Bold').text('7. Budget Summary', 50, yPos);
    yPos += 25;

    // Budget breakdown table
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Category', 50, yPos);
    doc.text('Amount', 450, yPos, { width: 100, align: 'right' });
    yPos += 15;
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
    yPos += 10;

    doc.font('Helvetica');
    doc.text('Events Budget', 50, yPos);
    doc.text(`$${eventsBudget.toLocaleString()}`, 450, yPos, { width: 100, align: 'right' });
    yPos += 20;

    doc.text('Operating Budget', 50, yPos);
    doc.text(`$${operatingBudget.toLocaleString()}`, 450, yPos, { width: 100, align: 'right' });
    yPos += 20;

    doc.text('Capital Expenses', 50, yPos);
    doc.text(`$${capitalExpenses.toLocaleString()}`, 450, yPos, { width: 100, align: 'right' });
    yPos += 20;

    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
    yPos += 10;

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('TOTAL BUDGET REQUEST', 50, yPos);
    doc.text(`$${totalBudget.toLocaleString()}`, 450, yPos, { width: 100, align: 'right' });

    if (sections.section7?.budget_justification) {
      yPos += 30;
      doc.fontSize(10).font('Helvetica-Bold').text('Budget Justification:', 50, yPos);
      yPos += 15;
      doc.font('Helvetica').text(sections.section7.budget_justification, 50, yPos, { width: 500 });
      yPos += doc.heightOfString(sections.section7.budget_justification, { width: 500 }) + 15;
    }

    if (sections.section7?.funding_sources) {
      doc.font('Helvetica-Bold').text('Funding Sources:', 50, yPos);
      yPos += 15;
      doc.font('Helvetica').text(sections.section7.funding_sources, 50, yPos, { width: 500 });
      yPos += doc.heightOfString(sections.section7.funding_sources, { width: 500 }) + 15;
    }

    if (sections.section7?.previous_year_comparison) {
      doc.font('Helvetica-Bold').text('Previous Year Comparison:', 50, yPos);
      yPos += 15;
      doc.font('Helvetica').text(sections.section7.previous_year_comparison, 50, yPos, { width: 500 });
      yPos += doc.heightOfString(sections.section7.previous_year_comparison, { width: 500 }) + 15;
    }

    // Section 8: Challenges & Opportunities
    if (sections.section8) {
      doc.addPage();
      yPos = 50;
      doc.fontSize(14).font('Helvetica-Bold').text('8. Challenges & Opportunities', 50, yPos);
      yPos += 25;
      doc.fontSize(10).font('Helvetica');

      if (sections.section8.challenges) {
        doc.font('Helvetica-Bold').text('Current Challenges:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section8.challenges, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section8.challenges, { width: 500 }) + 15;
      }

      if (sections.section8.solutions) {
        doc.font('Helvetica-Bold').text('Proposed Solutions:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section8.solutions, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section8.solutions, { width: 500 }) + 15;
      }

      if (sections.section8.opportunities) {
        doc.font('Helvetica-Bold').text('Growth Opportunities:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section8.opportunities, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section8.opportunities, { width: 500 }) + 15;
      }

      if (sections.section8.support_needed) {
        doc.font('Helvetica-Bold').text('Support Needed:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section8.support_needed, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section8.support_needed, { width: 500 }) + 15;
      }

      if (sections.section8.collaboration) {
        doc.font('Helvetica-Bold').text('Collaboration Opportunities:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section8.collaboration, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section8.collaboration, { width: 500 }) + 15;
      }
    }

    // Section 9: Additional Information
    if (sections.section9) {
      doc.addPage();
      yPos = 50;
      doc.fontSize(14).font('Helvetica-Bold').text('9. Additional Information', 50, yPos);
      yPos += 25;
      doc.fontSize(10).font('Helvetica');

      if (sections.section9.success_stories) {
        doc.font('Helvetica-Bold').text('Success Stories & Testimonials:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section9.success_stories, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section9.success_stories, { width: 500 }) + 15;
      }

      if (sections.section9.communication_plan) {
        doc.font('Helvetica-Bold').text('Communication Plan:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section9.communication_plan, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section9.communication_plan, { width: 500 }) + 15;
      }

      if (sections.section9.volunteer_management) {
        doc.font('Helvetica-Bold').text('Volunteer Management:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section9.volunteer_management, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section9.volunteer_management, { width: 500 }) + 15;
      }

      if (sections.section9.evaluation_metrics) {
        doc.font('Helvetica-Bold').text('Evaluation & Metrics:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section9.evaluation_metrics, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section9.evaluation_metrics, { width: 500 }) + 15;
      }

      if (sections.section9.long_term_vision) {
        doc.font('Helvetica-Bold').text('Long-Term Vision:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section9.long_term_vision, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section9.long_term_vision, { width: 500 }) + 15;
      }

      if (sections.section9.additional_comments) {
        doc.font('Helvetica-Bold').text('Additional Comments:', 50, yPos);
        yPos += 15;
        doc.font('Helvetica').text(sections.section9.additional_comments, 50, yPos, { width: 500 });
        yPos += doc.heightOfString(sections.section9.additional_comments, { width: 500 }) + 15;
      }
    }

    // Footer on last page
    doc.fontSize(8).fillColor('#666666');
    doc.text(
      `Generated on ${new Date().toLocaleString()} | The Voice Church Ministry Planning System`,
      50,
      750,
      { width: 500, align: 'center' }
    );

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
});

// GET /api/forms/:id/export/docx - Export form as Word document
router.get('/:id/export/docx', async (req, res) => {
  try {
    const { id } = req.params;

    // Get form data
    const formResult = await pool.query(`
      SELECT 
        f.*,
        u.name as created_by_name
      FROM ministry_forms f
      LEFT JOIN users u ON f.ministry_leader_id = u.id
      WHERE f.id = $1
    `, [id]);

    if (formResult.rows.length === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const form = formResult.rows[0];

    // Get form section data from form_data table
    const sectionsResult = await pool.query(
      'SELECT section, data FROM form_data WHERE form_id = $1',
      [id]
    );

    // Build sections object
    const sections = {};
    sectionsResult.rows.forEach(row => {
      sections[row.section] = row.data;
    });

    // Get events
    const eventsResult = await pool.query(
      'SELECT *, estimated_expenses as budget_amount FROM events WHERE form_id = $1 ORDER BY event_date',
      [id]
    );
    const events = eventsResult.rows;
    const eventsWithRunningTotal = calculateRunningTotals(events);

    // Get goals
    const goalsResult = await pool.query(
      'SELECT * FROM goals WHERE form_id = $1 ORDER BY id',
      [id]
    );
    const goals = goalsResult.rows;

    // Calculate totals
    const eventsBudget = events.reduce((sum, e) => sum + parseFloat(e.budget_amount || 0), 0);
    const operatingBudget = parseFloat(sections.section7?.operating_budget || 0);
    const capitalExpenses = parseFloat(sections.section7?.capital_expenses || 0);
    const totalBudget = eventsBudget + operatingBudget + capitalExpenses;

    // Create Word document
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720
            }
          }
        },
        children: [
          // Header
          new Paragraph({
            text: 'The Voice Church',
            heading: 'Heading1',
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: 'Ministry Budget & Planning Form',
            heading: 'Heading2',
            spacing: { after: 400 }
          }),

          // Status
          new Paragraph({
            children: [
              new TextRun({
                text: `Status: ${getStatusText(form.status)}`,
                bold: true,
                color: form.status === 'approved' ? '10b981' : form.status === 'rejected' ? 'ef4444' : 'f59e0b'
              })
            ],
            spacing: { after: 200 }
          }),

          // Form details
          new Paragraph({
            children: [
              new TextRun({ text: `Form Number: `, bold: true }),
              new TextRun({ text: form.form_number })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Ministry: `, bold: true }),
              new TextRun({ text: form.ministry_name })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Created By: `, bold: true }),
              new TextRun({ text: form.created_by_name })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Date: `, bold: true }),
              new TextRun({ text: new Date(form.created_at).toLocaleDateString() })
            ],
            spacing: { after: 400 }
          }),

          // Total Budget Highlight
          new Paragraph({
            text: 'TOTAL BUDGET REQUEST',
            heading: 'Heading2',
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `$${totalBudget.toLocaleString()}`,
                bold: true,
                size: 32,
                color: '3b82f6'
              })
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: `Events: $${eventsBudget.toLocaleString()}  |  Operating: $${operatingBudget.toLocaleString()}  |  Capital: $${capitalExpenses.toLocaleString()}`,
            spacing: { after: 600 }
          }),

          // Section 1: Ministry Information
          ...(sections.section1 ? [
            new Paragraph({
              text: '1. Ministry Information',
              heading: 'Heading2',
              spacing: { before: 400, after: 200 }
            }),
            ...(sections.section1.leader_name ? [new Paragraph({
              children: [
                new TextRun({ text: 'Leader: ', bold: true }),
                new TextRun({ text: sections.section1.leader_name })
              ],
              spacing: { after: 100 }
            })] : []),
            ...(sections.section1.contact_email ? [new Paragraph({
              children: [
                new TextRun({ text: 'Email: ', bold: true }),
                new TextRun({ text: sections.section1.contact_email })
              ],
              spacing: { after: 100 }
            })] : []),
            ...(sections.section1.contact_phone ? [new Paragraph({
              children: [
                new TextRun({ text: 'Phone: ', bold: true }),
                new TextRun({ text: sections.section1.contact_phone })
              ],
              spacing: { after: 100 }
            })] : []),
            ...(sections.section1.active_members ? [new Paragraph({
              children: [
                new TextRun({ text: 'Active Members: ', bold: true }),
                new TextRun({ text: sections.section1.active_members.toString() })
              ],
              spacing: { after: 100 }
            })] : []),
            ...(sections.section1.description ? [new Paragraph({
              children: [
                new TextRun({ text: 'Description: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section1.description,
              spacing: { after: 200 }
            })] : [])
          ] : []),

          // Section 2: Mission & Vision
          ...(sections.section2 ? [
            new Paragraph({
              text: '2. Mission & Vision',
              heading: 'Heading2',
              spacing: { before: 400, after: 200 }
            }),
            ...(sections.section2.mission ? [new Paragraph({
              children: [
                new TextRun({ text: 'Mission Statement: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section2.mission,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section2.vision ? [new Paragraph({
              children: [
                new TextRun({ text: 'Vision Statement: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section2.vision,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section2.values ? [new Paragraph({
              children: [
                new TextRun({ text: 'Core Values: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section2.values,
              spacing: { after: 200 }
            })] : [])
          ] : []),

          // Section 3: Programs & Activities
          ...(sections.section3 ? [
            new Paragraph({
              text: '3. Programs & Activities',
              heading: 'Heading2',
              spacing: { before: 400, after: 200 }
            }),
            ...(sections.section3.current_programs ? [new Paragraph({
              children: [
                new TextRun({ text: 'Current Programs: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section3.current_programs,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section3.target_audience ? [new Paragraph({
              children: [
                new TextRun({ text: 'Target Audience: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section3.target_audience,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section3.proposed_programs ? [new Paragraph({
              children: [
                new TextRun({ text: 'Proposed New Programs: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section3.proposed_programs,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section3.meeting_schedule ? [new Paragraph({
              children: [
                new TextRun({ text: 'Meeting Schedule: ', bold: true }),
                new TextRun({ text: sections.section3.meeting_schedule })
              ],
              spacing: { after: 200 }
            })] : [])
          ] : []),

          // Events Section
          ...(events.length > 0 ? [
            new Paragraph({
              text: `4. Ministry Events (${events.length})`,
              heading: 'Heading2',
              spacing: { before: 400, after: 200 }
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'Event Name', bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: 'Date', bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: 'Type', bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: 'Budget', bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: 'Running Total', bold: true })] })
                  ]
                }),
                ...eventsWithRunningTotal.map(event => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(event.event_name)] }),
                    new TableCell({ children: [new Paragraph(new Date(event.event_date).toLocaleDateString())] }),
                    new TableCell({ children: [new Paragraph(event.event_type)] }),
                    new TableCell({ children: [new Paragraph(`$${parseFloat(event.budget_amount).toLocaleString()}`)] }),
                    new TableCell({ children: [new Paragraph({ text: `$${event.running_total.toLocaleString()}`, bold: true })] })
                  ]
                }))
              ]
            })
          ] : []),

          // Goals Section
          ...(goals.length > 0 ? [
            new Paragraph({
              text: `5. SMART Goals (${goals.length})`,
              heading: 'Heading2',
              spacing: { before: 400, after: 200 }
            }),
            ...goals.flatMap((goal, index) => [
              new Paragraph({
                text: `Goal ${index + 1}: ${goal.goal_description}`,
                bold: true,
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Specific: ', bold: true }),
                  new TextRun({ text: goal.specific || '' })
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Measurable: ', bold: true }),
                  new TextRun({ text: goal.measurable || '' })
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Achievable: ', bold: true }),
                  new TextRun({ text: goal.achievable || '' })
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Relevant: ', bold: true }),
                  new TextRun({ text: goal.relevant || '' })
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Time-bound: ', bold: true }),
                  new TextRun({ text: goal.time_bound || '' })
                ],
                spacing: { after: 200 }
              })
            ])
          ] : []),

          // Section 6: Resources Needed
          ...(sections.section6 ? [
            new Paragraph({
              text: '6. Resources Needed',
              heading: 'Heading2',
              spacing: { before: 400, after: 200 }
            }),
            ...(sections.section6.personnel_needs ? [new Paragraph({
              children: [
                new TextRun({ text: 'Personnel Needs: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section6.personnel_needs,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section6.equipment_needs ? [new Paragraph({
              children: [
                new TextRun({ text: 'Equipment & Materials: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section6.equipment_needs,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section6.facility_needs ? [new Paragraph({
              children: [
                new TextRun({ text: 'Facility Requirements: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section6.facility_needs,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section6.technology_needs ? [new Paragraph({
              children: [
                new TextRun({ text: 'Technology & Software: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section6.technology_needs,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section6.training_needs ? [new Paragraph({
              children: [
                new TextRun({ text: 'Training & Development: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section6.training_needs,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section6.other_needs ? [new Paragraph({
              children: [
                new TextRun({ text: 'Other Resources: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section6.other_needs,
              spacing: { after: 200 }
            })] : [])
          ] : []),

          // Budget Summary
          new Paragraph({
            text: '7. Budget Summary',
            heading: 'Heading2',
            spacing: { before: 400, after: 200 }
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Events Budget')] }),
                  new TableCell({ children: [new Paragraph(`$${eventsBudget.toLocaleString()}`)] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Operating Budget')] }),
                  new TableCell({ children: [new Paragraph(`$${operatingBudget.toLocaleString()}`)] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Capital Expenses')] }),
                  new TableCell({ children: [new Paragraph(`$${capitalExpenses.toLocaleString()}`)] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'TOTAL', bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: `$${totalBudget.toLocaleString()}`, bold: true })] })
                ]
              })
            ]
          }),
          ...(sections.section7?.budget_justification ? [new Paragraph({
            children: [
              new TextRun({ text: 'Budget Justification: ', bold: true })
            ],
            spacing: { before: 200, after: 50 }
          }), new Paragraph({
            text: sections.section7.budget_justification,
            spacing: { after: 200 }
          })] : []),
          ...(sections.section7?.funding_sources ? [new Paragraph({
            children: [
              new TextRun({ text: 'Funding Sources: ', bold: true })
            ],
            spacing: { before: 200, after: 50 }
          }), new Paragraph({
            text: sections.section7.funding_sources,
            spacing: { after: 200 }
          })] : []),
          ...(sections.section7?.previous_year_comparison ? [new Paragraph({
            children: [
              new TextRun({ text: 'Previous Year Comparison: ', bold: true })
            ],
            spacing: { before: 200, after: 50 }
          }), new Paragraph({
            text: sections.section7.previous_year_comparison,
            spacing: { after: 200 }
          })] : []),

          // Section 8: Challenges & Opportunities
          ...(sections.section8 ? [
            new Paragraph({
              text: '8. Challenges & Opportunities',
              heading: 'Heading2',
              spacing: { before: 400, after: 200 }
            }),
            ...(sections.section8.challenges ? [new Paragraph({
              children: [
                new TextRun({ text: 'Current Challenges: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section8.challenges,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section8.solutions ? [new Paragraph({
              children: [
                new TextRun({ text: 'Proposed Solutions: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section8.solutions,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section8.opportunities ? [new Paragraph({
              children: [
                new TextRun({ text: 'Growth Opportunities: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section8.opportunities,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section8.support_needed ? [new Paragraph({
              children: [
                new TextRun({ text: 'Support Needed: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section8.support_needed,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section8.collaboration ? [new Paragraph({
              children: [
                new TextRun({ text: 'Collaboration Opportunities: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section8.collaboration,
              spacing: { after: 200 }
            })] : [])
          ] : []),

          // Section 9: Additional Information
          ...(sections.section9 ? [
            new Paragraph({
              text: '9. Additional Information',
              heading: 'Heading2',
              spacing: { before: 400, after: 200 }
            }),
            ...(sections.section9.success_stories ? [new Paragraph({
              children: [
                new TextRun({ text: 'Success Stories & Testimonials: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section9.success_stories,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section9.communication_plan ? [new Paragraph({
              children: [
                new TextRun({ text: 'Communication Plan: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section9.communication_plan,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section9.volunteer_management ? [new Paragraph({
              children: [
                new TextRun({ text: 'Volunteer Management: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section9.volunteer_management,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section9.evaluation_metrics ? [new Paragraph({
              children: [
                new TextRun({ text: 'Evaluation & Metrics: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section9.evaluation_metrics,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section9.long_term_vision ? [new Paragraph({
              children: [
                new TextRun({ text: 'Long-Term Vision: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section9.long_term_vision,
              spacing: { after: 200 }
            })] : []),
            ...(sections.section9.additional_comments ? [new Paragraph({
              children: [
                new TextRun({ text: 'Additional Comments: ', bold: true })
              ],
              spacing: { after: 50 }
            }), new Paragraph({
              text: sections.section9.additional_comments,
              spacing: { after: 200 }
            })] : [])
          ] : []),

          // Footer
          new Paragraph({
            text: `Generated on ${new Date().toLocaleString()} | The Voice Church Ministry Planning System`,
            spacing: { before: 800 },
            alignment: AlignmentType.CENTER
          })
        ]
      }]
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=Form-${form.form_number}.docx`);

    res.send(buffer);
  } catch (error) {
    console.error('Error generating Word document:', error);
    res.status(500).json({ message: 'Error generating Word document' });
  }
});

module.exports = { router, initializeRouter };
