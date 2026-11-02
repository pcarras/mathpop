"""reference.docx com os estilos da sebenta (cores e caixas do guia de estilo)"""
import subprocess
from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
subprocess.run(['pandoc', '-o', 'ref_base.docx', '--print-default-data-file', 'reference.docx'], check=True)
d = Document('ref_base.docx')
S = d.styles
NAVY, TEAL = RGBColor(0x1F, 0x3A, 0x5F), RGBColor(0x0F, 0x7B, 0x8A)
for sec in d.sections:
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    sec.left_margin = sec.right_margin = Cm(2.4); sec.top_margin = Cm(2.4); sec.bottom_margin = Cm(2.6)


def font(st, name, size=None, color=None, bold=None):
    f = st.font; f.name = name
    rpr = st.element.get_or_add_rPr(); rf = rpr.find(qn('w:rFonts'))
    if rf is None: rf = OxmlElement('w:rFonts'); rpr.append(rf)
    for a in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'): rf.set(qn(a), name)
    for a in ('w:asciiTheme', 'w:hAnsiTheme', 'w:cstheme', 'w:eastAsiaTheme'):
        if rf.get(qn(a)) is not None: del rf.attrib[qn(a)]
    if size: f.size = Pt(size)
    if color is not None: f.color.rgb = color
    if bold is not None: f.bold = bold


for nm in ('Normal', 'Body Text', 'First Paragraph', 'Compact'):
    try: font(S[nm], 'Libertinus Serif', 11)
    except KeyError: pass
for nm, sz, col in (('Title', 30, NAVY), ('Subtitle', 15, TEAL), ('Heading 1', 22, NAVY), ('Heading 2', 15, NAVY), ('Heading 3', 12.5, TEAL), ('Author', 11, RGBColor(0x5F, 0x6B, 0x7A))):
    try: font(S[nm], 'Lato', sz, col, bold=nm.startswith('Heading 1') or nm == 'Title')
    except KeyError: pass


def shade_style(name, fill, bar, base='Normal'):
    try:
        st = S[name]
    except KeyError:
        st = S.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
    st.base_style = S['Body Text'] if 'Body Text' in [s.name for s in S] else S['Normal']
    ppr = st.element.get_or_add_pPr()
    shd = OxmlElement('w:shd'); shd.set(qn('w:val'), 'clear'); shd.set(qn('w:color'), 'auto'); shd.set(qn('w:fill'), fill); ppr.append(shd)
    bdr = OxmlElement('w:pBdr'); l = OxmlElement('w:left')
    for k, v in (('w:val', 'single'), ('w:sz', '24'), ('w:space', '6'), ('w:color', bar)): l.set(qn(k), v)
    bdr.append(l); ppr.insert(0, bdr)
    ind = OxmlElement('w:ind'); ind.set(qn('w:left'), '180'); ind.set(qn('w:right'), '120'); ppr.append(ind)
    st.paragraph_format.space_after = Pt(3); st.paragraph_format.space_before = Pt(0)


for name, fill, bar in (('Caixa Definicao', 'EAF1F8', '1F3A5F'), ('Caixa Propriedade', 'E6F4F1', '0F7B8A'), ('Caixa Metodo', 'E8F5EE', '2E7D5B'),
                        ('Caixa Exemplo', 'FFFFFF', '7A8CA3'), ('Caixa Nota', 'F1F3F5', '5F6B7A'), ('Caixa Atencao', 'FFF4E0', 'B7791F'),
                        ('Caixa Dica', 'EEEAF7', '5B4B9A'), ('Caixa Enunciado', 'F1F3F5', '1F3A5F'), ('Caixa Resolucao', 'FFFFFF', '2E7D5B'), ('Caixa Teste', 'EAF1F8', '1F3A5F')):
    shade_style(name, fill, bar)
for name, color, border in (('Redutor', RGBColor(0xC6, 0x28, 0x28), True), ('Multiplicador', TEAL, False)):
    try: st = S[name]
    except KeyError: st = S.add_style(name, WD_STYLE_TYPE.CHARACTER)
    st.font.color.rgb = color; st.font.bold = True
    if border:
        rpr = st.element.get_or_add_rPr(); b = OxmlElement('w:bdr')
        for k, v in (('w:val', 'single'), ('w:sz', '8'), ('w:space', '1'), ('w:color', 'C62828')): b.set(qn(k), v)
        rpr.append(b)
d.save('reference.docx')
print('ok')
