from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import inch
from datetime import datetime
import os

def generate_po_pdf(data, output_path):
    """
    Generates a professional Procurement PO PDF.
    
    Data expected:
    {
        "po_number": "PO-0042",
        "date": "21 Apr 2026",
        "status": "APPROVED",
        "tenant_name": "UMLAB Sarawak",
        "vendor_name": "Borneo Scientific",
        "vendor_details": "Lot 123, Kuching...",
        "ship_to": "UMLAB HQ, Kuching...",
        "items": [...],
        "subtotal": 500.00,
        "tax": 0.00,
        "total": 500.00,
        "notes": "Optional notes",
        "requested_by": "John Doe",
        "approved_by": "Jane Smith",
        "date_approved": "20 Apr 2026"
    }
    """
    doc = SimpleDocTemplate(output_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    accent_color = colors.hexColor("#C0392B") # Deep Red
    
    title_style = ParagraphStyle(
        'PO_Title',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.black,
        fontName='Helvetica-Bold',
        spaceAfter=10
    )
    
    header_label_style = ParagraphStyle(
        'Header_Label',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.gray,
        fontName='Helvetica-Bold'
    )
    
    accent_style = ParagraphStyle(
        'Accent',
        parent=styles['Normal'],
        fontSize=10,
        textColor=accent_color,
        fontName='Helvetica-Bold'
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica'
    )

    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.gray,
        fontName='Helvetica',
        alignment=1 # Center
    )

    elements = []

    # 1. Header Bar & Top Info
    # [TENANT NAME large] PO NUMBER: PO-XXXX
    # DATE: DD MMM YYYY
    # STATUS: Approved
    
    header_data = [
        [
            Paragraph(f"<b>{data.get('tenant_name', 'ProcureSure').upper()}</b>", title_style),
            [
                Paragraph(f"<b>PO NUMBER:</b> {data.get('po_number', 'PO-0000')}", body_style),
                Paragraph(f"<b>DATE:</b> {data.get('date', 'N/A')}", body_style),
                Paragraph(f"<b>STATUS:</b> <font color='#C0392B'>{data.get('status', 'APPROVED')}</font>", body_style)
            ]
        ]
    ]
    
    header_table = Table(header_data, colWidths=[3.5*inch, 2.5*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 20))
    
    # "PURCHASE ORDER" centered bar
    elements.append(HRFlowable(width="100%", thickness=2, color=accent_color, spaceBefore=5, spaceAfter=5))
    po_header_style = ParagraphStyle('PO_Header', parent=styles['Normal'], fontSize=16, fontName='Helvetica-Bold', alignment=1, textColor=accent_color)
    elements.append(Paragraph("PURCHASE ORDER", po_header_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=accent_color, spaceBefore=5, spaceAfter=15))

    # 2. Vendor & Ship To
    address_data = [
        [Paragraph("<b>VENDOR:</b>", accent_style), Paragraph("<b>SHIP TO / BILL TO:</b>", accent_style)],
        [
            Paragraph(f"{data.get('vendor_name', 'N/A')}<br/>{data.get('vendor_details', '')}", body_style),
            Paragraph(f"{data.get('tenant_name', 'N/A')}<br/>{data.get('ship_to', 'HQ Address Default')}", body_style)
        ]
    ]
    address_table = Table(address_data, colWidths=[3*inch, 3*inch])
    address_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
    ]))
    elements.append(address_table)

    # 3. Items Table
    # # | DESCRIPTION | QTY | UNIT PRICE | TOTAL
    table_header = [
        Paragraph("<b>#</b>", body_style),
        Paragraph("<b>DESCRIPTION</b>", body_style),
        Paragraph("<b>QTY</b>", body_style),
        Paragraph("<b>UNIT PRICE</b>", body_style),
        Paragraph("<b>TOTAL</b>", body_style)
    ]
    
    table_data = [table_header]
    
    for idx, item in enumerate(data.get('items', []), 1):
        table_data.append([
            str(idx),
            Paragraph(item.get('description', ''), body_style),
            str(item.get('quantity', 0)),
            f"RM {item.get('unit_price', 0):,.2f}",
            f"RM {item.get('total_price', 0):,.2f}"
        ])
    
    # 4. Summation
    table_data.append(["", "", "", Paragraph("<b>SUBTOTAL:</b>", body_style), f"RM {data.get('subtotal', 0):,.2f}"])
    table_data.append(["", "", "", Paragraph("<b>TAX (0%):</b>", body_style), f"RM {data.get('tax', 0):,.2f}"])
    table_data.append(["", "", "", Paragraph("<b>TOTAL:</b>", accent_style), Paragraph(f"<b>RM {data.get('total', 0):,.2f}</b>", accent_style)])

    items_table = Table(table_data, colWidths=[0.4*inch, 3*inch, 0.6*inch, 1*inch, 1*inch])
    items_table.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black),
        ('LINEBELOW', (0, -3), (-1, -3), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 20))

    # 5. Notes
    if data.get('notes'):
        elements.append(Paragraph(f"<b>NOTES:</b> {data['notes']}", body_style))
        elements.append(Spacer(1, 20))

    # 6. Approvals
    # REQUESTED BY: [requester name] APPROVED BY: [approver name]
    # DATE APPROVED: [date]
    approval_data = [
        [
            Paragraph(f"<b>REQUESTED BY:</b><br/>{data.get('requested_by', 'N/A')}", body_style),
            Paragraph(f"<b>APPROVED BY:</b><br/>{data.get('approved_by', 'N/A')}<br/><b>DATE APPROVED:</b> {data.get('date_approved', 'N/A')}", body_style)
        ]
    ]
    approval_table = Table(approval_data, colWidths=[3*inch, 3*inch])
    approval_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 20),
    ]))
    elements.append(approval_table)

    # 7. Footer
    elements.append(Spacer(1, 40))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.gray))
    elements.append(Spacer(1, 5))
    elements.append(Paragraph("This is a system-generated document from ProcureSure.", footer_style))

    # Build PDF
    doc.build(elements)
    return output_path

