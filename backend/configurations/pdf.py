from io import BytesIO
from datetime import date

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.enums import TA_RIGHT, TA_CENTER

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 20 * mm

PRIMARY = colors.HexColor("#111827")
MUTED = colors.HexColor("#6B7280")
ACCENT = colors.HexColor("#1D4ED8")
BORDER = colors.HexColor("#E5E7EB")
ROW_ALT = colors.HexColor("#F9FAFB")
PARENT_BG = colors.HexColor("#F3F4F6")


def _styles():
    return {
        "title": ParagraphStyle(
            "title", fontSize=26, textColor=PRIMARY,
            fontName="Helvetica-Bold", spaceAfter=6,
        ),
        "label": ParagraphStyle(
            "label", fontSize=8, textColor=MUTED,
            fontName="Helvetica", spaceAfter=2, leading=10,
        ),
        "value": ParagraphStyle(
            "value", fontSize=10, textColor=PRIMARY,
            fontName="Helvetica", spaceAfter=0, leading=14,
        ),
        "value_bold": ParagraphStyle(
            "value_bold", fontSize=10, textColor=PRIMARY,
            fontName="Helvetica-Bold", spaceAfter=0, leading=14,
        ),
        "th": ParagraphStyle(
            "th", fontSize=8, textColor=colors.white,
            fontName="Helvetica-Bold", leading=12,
        ),
        "th_right": ParagraphStyle(
            "th_right", fontSize=8, textColor=colors.white,
            fontName="Helvetica-Bold", leading=12, alignment=TA_RIGHT,
        ),
        # Parent row — bold, darker text
        "td_parent": ParagraphStyle(
            "td_parent", fontSize=9, textColor=PRIMARY,
            fontName="Helvetica-Bold", leading=13,
        ),
        "td_parent_right": ParagraphStyle(
            "td_parent_right", fontSize=9, textColor=PRIMARY,
            fontName="Helvetica-Bold", leading=13, alignment=TA_RIGHT,
        ),
        # Child row — regular, slightly indented
        "td_child": ParagraphStyle(
            "td_child", fontSize=9, textColor=PRIMARY,
            fontName="Helvetica", leading=13, leftIndent=10,
        ),
        "td_child_right": ParagraphStyle(
            "td_child_right", fontSize=9, textColor=PRIMARY,
            fontName="Helvetica", leading=13, alignment=TA_RIGHT,
        ),
        # Standalone row (no children, no parent in snapshot)
        "td": ParagraphStyle(
            "td", fontSize=9, textColor=PRIMARY,
            fontName="Helvetica", leading=13,
        ),
        "td_right": ParagraphStyle(
            "td_right", fontSize=9, textColor=PRIMARY,
            fontName="Helvetica", leading=13, alignment=TA_RIGHT,
        ),
        "total_label": ParagraphStyle(
            "total_label", fontSize=10, textColor=PRIMARY,
            fontName="Helvetica-Bold", alignment=TA_RIGHT,
        ),
        "total_value": ParagraphStyle(
            "total_value", fontSize=12, textColor=ACCENT,
            fontName="Helvetica-Bold", alignment=TA_RIGHT,
        ),
        "footer": ParagraphStyle(
            "footer", fontSize=8, textColor=MUTED, alignment=TA_CENTER,
        ),
    }


def _fmt_eur(amount: float) -> str:
    """Format a float as Dutch euro string: € 1.234,56"""
    return f"€ {amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _build_tree(snapshot: dict) -> list:
    """
    Returns an ordered list of (component_id, is_child) tuples reflecting the
    parent→child hierarchy from the Component model.

    Roots = items whose parent is NULL or whose parent is not in the snapshot.
    Children = items whose parent IS in the snapshot, ordered under their parent.
    """
    from components.models import Component

    ids = [int(k) for k in snapshot.keys()]
    if not ids:
        return []

    id_set = set(ids)
    components = Component.objects.filter(id__in=ids).values("id", "parent_id", "order")
    comp_map = {c["id"]: c for c in components}

    # Determine which IDs are children of another snapshot item
    child_ids = {
        c["id"] for c in comp_map.values()
        if c["parent_id"] is not None and c["parent_id"] in id_set
    }
    root_ids = [i for i in ids if i not in child_ids]

    # Sort roots by their order field
    root_ids.sort(key=lambda i: comp_map.get(i, {}).get("order", 0))

    result = []
    for root_id in root_ids:
        result.append((root_id, False))
        # Find direct children of this root that are in snapshot
        children = [
            c for c in comp_map.values()
            if c["parent_id"] == root_id and c["id"] in id_set
        ]
        children.sort(key=lambda c: c["order"])
        for child in children:
            result.append((child["id"], True))

    return result


def generate_quote_pdf(project, configuration) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN,
    )

    s = _styles()
    story = []
    usable_width = PAGE_WIDTH - 2 * MARGIN

    # ── Page header ──────────────────────────────────────────────────────
    quote_date = date.today().strftime("%d-%m-%Y")

    creator_name = "—"
    if project.created_by:
        creator_name = project.created_by.get_full_name() or project.created_by.email

    meta_table = Table(
        [
            [Paragraph("Offertedatum", s["label"]), Paragraph("Projectnaam", s["label"])],
            [Paragraph(quote_date, s["value_bold"]), Paragraph(project.name, s["value_bold"])],
            [Paragraph("Organisatie", s["label"]), Paragraph("Aangemaakt door", s["label"])],
            [Paragraph(project.organization.name, s["value"]), Paragraph(creator_name, s["value"])],
        ],
        colWidths=[usable_width * 0.22, usable_width * 0.22],
        style=TableStyle([
            ("TOPPADDING", (0, 0), (-1, -1), 1),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ]),
    )

    header_table = Table(
        [[Paragraph("OFFERTE", s["title"]), meta_table]],
        colWidths=[usable_width * 0.5, usable_width * 0.5],
        style=TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]),
    )
    story.append(header_table)
    story.append(Spacer(1, 5 * mm))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 5 * mm))

    # ── Configuration type ───────────────────────────────────────────────
    config_type_name = (
        configuration.configuration_type.name if configuration.configuration_type else "—"
    )
    story.append(Paragraph("Configuratietype", s["label"]))
    story.append(Paragraph(config_type_name, s["value_bold"]))
    story.append(Spacer(1, 6 * mm))

    # ── Line items ───────────────────────────────────────────────────────
    snapshot = configuration.data.get("price_snapshot", {})

    col_name = usable_width * 0.52
    col_qty = usable_width * 0.12
    col_unit = usable_width * 0.16
    col_total = usable_width * 0.20

    tree = _build_tree(snapshot)

    # A root has children when at least one subsequent entry before the next root is a child
    roots_with_children = set()
    for idx, (cid, is_child) in enumerate(tree):
        if not is_child and idx + 1 < len(tree) and tree[idx + 1][1]:
            roots_with_children.add(cid)

    rows = [
        [
            Paragraph("Omschrijving", s["th"]),
            Paragraph("Aantal", s["th_right"]),
            Paragraph("Stukprijs", s["th_right"]),
            Paragraph("Totaal", s["th_right"]),
        ],
    ]

    # Track which row indices are parent rows for background styling
    parent_row_indices = []
    grand_total = 0.0

    for cid, is_child in tree:
        item = snapshot.get(str(cid))
        if item is None:
            continue

        name = item.get("name", "—")
        verkoop = float(item.get("verkoop", 0))
        raw_value = item.get("value", 1)
        qty = raw_value if isinstance(raw_value, (int, float)) else 1
        line_total = verkoop * qty
        grand_total += line_total

        is_parent_with_children = cid in roots_with_children

        if is_child:
            name_p = Paragraph(f"↳  {name}", s["td_child"])
            num_s = s["td_child_right"]
        elif is_parent_with_children:
            name_p = Paragraph(name, s["td_parent"])
            num_s = s["td_parent_right"]
            parent_row_indices.append(len(rows))
        else:
            name_p = Paragraph(name, s["td"])
            num_s = s["td_right"]

        rows.append([
            name_p,
            Paragraph(f"{qty:g}", num_s),
            Paragraph(_fmt_eur(verkoop), num_s),
            Paragraph(_fmt_eur(line_total), num_s),
        ])

    # Build TableStyle — alternate row colours, then override parent rows
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, ROW_ALT]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    for ri in parent_row_indices:
        style_cmds.append(("BACKGROUND", (0, ri), (-1, ri), PARENT_BG))

    items_table = Table(
        rows,
        colWidths=[col_name, col_qty, col_unit, col_total],
        style=TableStyle(style_cmds),
        repeatRows=1,
    )
    story.append(items_table)
    story.append(Spacer(1, 4 * mm))

    # ── Total ────────────────────────────────────────────────────────────
    total_table = Table(
        [[Paragraph("Totaal excl. BTW", s["total_label"]), Paragraph(_fmt_eur(grand_total), s["total_value"])]],
        colWidths=[usable_width * 0.78, usable_width * 0.22],
        style=TableStyle([
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("LINEABOVE", (0, 0), (-1, 0), 1, PRIMARY),
        ]),
    )
    story.append(total_table)

    # ── Footer ───────────────────────────────────────────────────────────
    story.append(Spacer(1, 10 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        "Deze offerte is gegenereerd door het Blaashal Configuratiesysteem. "
        "Prijzen zijn exclusief BTW en geldig tot 30 dagen na offertedatum.",
        s["footer"],
    ))

    doc.build(story)
    return buffer.getvalue()
