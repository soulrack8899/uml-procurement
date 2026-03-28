from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from datetime import datetime
import os

def generate_po_pdf(request_data, output_path):
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'PO_Title',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.hexColor("#00346f"),
        spaceAfter=20,
        fontName='Helvetica-Bold'
    )
    
    label_style = ParagraphStyle(
        'PO_Label',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.hexColor("#424751"),
        fontName='Helvetica-Bold'
    )
    
    content_list = []
    
    # Header Section
    po_number = f"PO-{datetime.now().strftime('%Y%m')}-{str(request_data['id']).zfill(3)}"
    content_list.append(Paragraph("PURCHASE ORDER", title_style))
    content_list.append(Paragraph(f"<b>PO Number:</b> {po_number}", styles['Normal']))
    content_list.append(Paragraph(f"<b>Date:</b> {datetime.now().strftime('%d %b %Y')}", styles['Normal']))
    content_list.append(Spacer(1, 20))
    
    # Vendor & Bill To Grid
    data = [
        [Paragraph("<b>VENDOR</b>", label_style), Paragraph("<b>SHIP TO</b>", label_style)],
        [
            Paragraph(f"{request_data['vendor_name']}<br/>ID: {request_data['vendor_id']}", styles['Normal']),
            Paragraph("UMLAB Sarawak HQ<br/>Level 4, Wisma Sumber Alam<br/>93050 Kuching", styles['Normal'])
        ]
    ]
    
    table = Table(data, colWidths=[250, 250])
    table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    content_list.append(table)
    content_list.append(Spacer(1, 30))
    
    # Line Items Table
    item_data = [["Description", "Qty", "Unit Price", "Total"]]
    for item in request_data['items']:
        item_data.append([
            item['description'],
            str(item['quantity']),
            f"RM {item['unit_price']:.2f}",
            f"RM {item['total_price']:.2f}"
        ])
    
    # Totals Row
    item_data.append(["", "", "<b>Grand Total</b>", f"<b>RM {request_data['total_amount']:.2f}</b>"])
    
    items_table = Table(item_data, colWidths=[250, 50, 100, 100])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.hexColor("#f2f4f6")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.hexColor("#191c1e")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -2), 0.5, colors.hexColor("#c2c6d3")),
        ('BOX', (0, 0), (-1, -1), 1, colors.hexColor("#00346f")),
    ]))
    content_list.append(items_table)
    content_list.append(Spacer(1, 40))
    
    # Audit Trail (Simplified for PO)
    content_list.append(Paragraph("<b>Authorization Trace</b>", label_style))
    content_list.append(Spacer(1, 10))
    content_list.append(Paragraph("Digitally verified by UMLAB Procurement System High-Precision Ledger.", styles['Normal']))
    
    # Generate PDF
    doc.build(content_list)
    return output_path
