"""Oral-exam question bank for 220375 ERA. Run: python quiz/bank.py OUT.json

Types
  mcq     : q, opts[list], a (index), ex (explanation)
  explain : q, model (model answer, HTML + KaTeX), keys (points the examiner expects)
  num     : q, ans (computed here), tol (relative), unit, sol (worked solution)
Numeric answers are computed with the formulas below, never typed.
Topics: t01..t09 theory; A1, A2, A3 assignment-method questions (no graded results before the deadlines).
"""
import json
import math
import sys

Q = []


def mcq(topic, q, opts, a, ex):
    Q.append(dict(topic=topic, type="mcq", q=q, opts=opts, a=a, ex=ex))


def explain(topic, q, model, keys):
    Q.append(dict(topic=topic, type="explain", q=q, model=model, keys=keys))


def num(topic, q, ans, unit, sol, tol=0.02):
    Q.append(dict(topic=topic, type="num", q=q, ans=float(ans), unit=unit, sol=sol, tol=tol))


pi = math.pi

# ---------------------------------------------------------------- t01
mcq("t01", "¿Qué modelo estructural corresponde a un cable o a un tubo con uniones articuladas?",
    ["Viga", "Barra", "Placa", "Lámina"], 1,
    "Al ser esbelto y estar articulado no transmite momentos: solo trabaja a esfuerzo axil, así que es una barra.")
mcq("t01", "En una estructura semimonocasco, ¿qué elemento lleva principalmente la tensión normal de flexión?",
    ["El revestimiento", "Los larguerillos y largueros", "Las costillas", "Las cuadernas"], 1,
    "Los larguerillos y los largueros concentran el área lejos del eje neutro y resisten $\\sigma_z$; el revestimiento trabaja sobre todo a cortante.")
mcq("t01", "¿Qué tres conjuntos de ecuaciones debe satisfacer la solución de un problema estructural?",
    ["Equilibrio, compatibilidad/contorno y ley constitutiva", "Solo equilibrio", "Equilibrio y energía cinética", "Continuidad y Bernoulli"], 0,
    "Equilibrio (Newton), relación constitutiva (Hooke o la ley del laminado) y compatibilidad con las condiciones de contorno.")
explain("t01", "Enumera las cargas que actúan sobre un avión y di cuáles aparecen en un vuelo no estacionario.",
        "<p>Peso (de estructura, combustible y carga de pago), sustentación $L$, resistencia $D$ y empuje $T$. En maniobras y ráfagas el factor de carga $n=L/W\\neq1$ y aparecen "
        "fuerzas de inercia $-m\\mathbf a$ (d'Alembert). Además: presurización de cabina, aterrizaje e impacto, y cargas térmicas.</p>",
        ["Peso, L, D, T", "maniobra y ráfaga: factor de carga", "fuerzas de inercia de d'Alembert", "presurización y aterrizaje"])
explain("t01", "¿Qué significa la hipótesis de pequeños desplazamientos y qué consecuencias tiene en el cálculo?",
        "<p>Se supone que los desplazamientos son pequeños frente a las dimensiones. Por eso el equilibrio se plantea en la <strong>geometría inicial</strong> y la "
        "relación deformación-desplazamiento es lineal. Con material elástico lineal, el problema es lineal ($\\mathbf K\\mathbf u = \\mathbf F$): se puede superponer, y "
        "$\\mathbf K$ no depende de la carga. Por eso las deformadas se dibujan <em>amplificadas</em>.</p>",
        ["equilibrio en la configuración inicial", "linealidad y superposición", "K independiente de u", "deformadas amplificadas"])
explain("t01", "Describe el esquema general del método de elementos finitos que vas a programar.",
        "<ol><li>Geometría: nodos, elementos y conectividades ($\\mathbf T_n$, $\\mathbf T_d$).</li><li>Matrices de rigidez (y fuerzas) elementales.</li>"
        "<li>Ensamblaje en $\\mathbf K$ y $\\mathbf F$.</li><li>Condiciones de contorno: partición en libres y prescritos, y solución.</li><li>Postproceso: reacciones, deformaciones, tensiones y pandeo.</li></ol>",
        ["discretización y conectividades", "rigidez elemental", "ensamblaje", "partición y solución", "postproceso"])

# ---------------------------------------------------------------- t02
mcq("t02", "La matriz de rigidez global $\\mathbf K$ de una estructura sin apoyos es…",
    ["Definida positiva e invertible", "Singular (semidefinida positiva)", "Antisimétrica", "Diagonal"], 1,
    "Admite movimientos de sólido rígido sin fuerzas: $\\mathbf K\\mathbf d_{RBM} = \\mathbf 0$. Deja de ser singular al imponer apoyos suficientes.")
mcq("t02", "¿Qué representa físicamente el término $K_{ij}$?",
    ["La fuerza en el GDL $i$ cuando $u_j=1$ y el resto es nulo", "El desplazamiento en $i$ por una fuerza unitaria en $j$", "La energía de deformación del elemento", "La reacción en $i$"], 0,
    "Las columnas de $\\mathbf K$ son vectores de fuerza producidos por desplazamientos unitarios. El desplazamiento por fuerza unitaria es la flexibilidad, $\\mathbf K^{-1}$.")
mcq("t02", "¿Por qué $\\mathbf K$ es simétrica?",
    ["Por la ley de Hooke lineal y pequeñas deformaciones (reciprocidad)", "Porque todos los elementos son iguales", "Por la numeración de nodos", "No lo es en general"], 0,
    "Material elástico lineal con pequeñas deformaciones: existe una energía de deformación cuadrática, y por el teorema de Maxwell-Betti $K_{ij}=K_{ji}$.")
explain("t02", "Deduce la matriz de rigidez de una barra 1D a partir de sus hipótesis.",
        "<p>Desplazamiento lineal: $u(x) = u_1 + (u_2-u_1)(x-x_1)/l$, así que $\\varepsilon = (u_2-u_1)/l$ es constante. Hooke: $\\sigma = E\\varepsilon$, y el axil es "
        "$p = A\\sigma = \\frac{EA}{l}(u_2-u_1)$. El equilibrio de los extremos da $F_1 = -p$ y $F_2 = p$:</p>"
        "$$\\begin{bmatrix}F_1\\\\F_2\\end{bmatrix} = \\frac{EA}{l}\\begin{bmatrix}1&-1\\\\-1&1\\end{bmatrix}\\begin{bmatrix}u_1\\\\u_2\\end{bmatrix}.$$",
        ["u lineal, ε constante", "Hooke y p = Aσ", "equilibrio F1 = −p, F2 = p", "EA/l [1 −1; −1 1]"])
explain("t02", "Explica la partición del sistema en grados de libertad libres y prescritos y cómo se obtienen las reacciones.",
        "$$\\begin{bmatrix}\\mathbf K_{RR}&\\mathbf K_{RL}\\\\\\mathbf K_{LR}&\\mathbf K_{LL}\\end{bmatrix}\\begin{bmatrix}\\mathbf u_R\\\\\\mathbf u_L\\end{bmatrix}=\\begin{bmatrix}\\mathbf F_R\\\\\\mathbf F_L\\end{bmatrix}+\\begin{bmatrix}\\mathbf R_R\\\\\\mathbf 0\\end{bmatrix}$$"
        "<p>La fila libre da $\\mathbf u_L = \\mathbf K_{LL}^{-1}(\\mathbf F_L - \\mathbf K_{LR}\\mathbf u_R)$, porque las reacciones solo existen en los GDL prescritos. La fila prescrita da "
        "$\\mathbf R_R = \\mathbf K_{RR}\\mathbf u_R + \\mathbf K_{RL}\\mathbf u_L - \\mathbf F_R$. Un desplazamiento impuesto $\\mathbf u_R\\neq0$ entra como carga: $-\\mathbf K_{LR}\\mathbf u_R$.</p>",
        ["separar L y R", "u_L de la fila libre", "R de la fila prescrita", "u_R ≠ 0 actúa como carga"])
explain("t02", "¿Cómo implementas el ensamblaje en código y qué papel juega la tabla $\\mathbf T_d$?",
        "<p>$\\mathbf T_d(e,i)$ da el GDL global del GDL local $i$ del elemento $e$ (en 2D, $T_d(e,(a-1)n_i+j) = n_i(T_n(e,a)-1)+j$). El ensamblaje es un doble bucle: "
        "<code>KG(Td(e,i),Td(e,j)) += Kel(i,j,e)</code>. Así no hay que construir matrices expandidas con ceros.</p>",
        ["Td: local → global", "fórmula n_i(nodo−1)+j", "doble bucle de suma", "sin expandir con ceros"])
k1, k2, F = 2000.0, 1000.0, 300.0
num("t02", f"Dos muelles en serie: $k_1 = {k1:.0f}$ N/mm (empotrado en el nodo 1) y $k_2 = {k2:.0f}$ N/mm (del nodo 2 al 3), con una fuerza de {F:.0f} N en el nodo 3. ¿Cuánto vale $u_3$ (mm)?",
    F / k1 + F / k2, "mm",
    f"En serie la fuerza es la misma en los dos muelles: $u_3 = F/k_1 + F/k_2 = {F/k1:.3f} + {F/k2:.3f} = {F/k1+F/k2:.3f}$ mm.")
D_ = 1.0
num("t02", "Barra 1–2 con $k_1 = 2k$ y barra 2–3 con $k_2 = k$, con $u_1=0$ y $u_3 = \\Delta = 1$ mm impuesto y sin fuerzas. ¿Cuánto vale $u_2$ (mm)?",
    D_ / 3, "mm", "Fila del nodo 2: $3k\\,u_2 - k\\Delta = 0$, así que $u_2 = \\Delta/3 = 0{,}333$ mm. La barra blanda absorbe la mayor parte del alargamiento.")
E, A, L, P = 70e3, 100.0, 2000.0, 7000.0
num("t02", f"Barra de aluminio ($E = 70$ GPa, $A = {A:.0f}$ mm², $L = {L/1000:.0f}$ m) empotrada en un extremo y con {P/1000:.0f} kN de tracción en el otro. ¿Alargamiento (mm)?",
    P * L / (E * A), "mm", f"$\\Delta l = PL/(EA) = {P:.0f}\\cdot{L:.0f}/({E:.0f}\\cdot{A:.0f}) = {P*L/(E*A):.3f}$ mm.")

# ---------------------------------------------------------------- t03
mcq("t03", "En 2D, ¿cuántos modos de sólido rígido hay que eliminar con los apoyos?", ["1", "2", "3", "6"], 2,
    "Dos traslaciones y un giro. En 3D son 6: tres traslaciones y tres giros.")
mcq("t03", "¿Por qué $\\mathbf R^{-1} = \\mathbf R^T$ en la transformación local-global?",
    ["Porque $\\mathbf R$ es una rotación (matriz ortogonal)", "Porque $\\mathbf R$ es simétrica", "Por convenio", "Solo en 2D"], 0,
    "Las filas de $\\mathbf R$ son los vectores unitarios ortonormales de los ejes locales, así que $\\mathbf R\\mathbf R^T = \\mathbf I$.")
mcq("t03", "Una celosía plana con $b = 9$ barras, $n = 6$ nodos y $r = 3$ GDL prescritos (sin mecanismos) es…",
    ["Isostática", "Hiperestática de grado 1", "Un mecanismo", "Hiperestática de grado 3"], 0,
    "$h = b + r - 2n = 9 + 3 - 12 = 0$: isostática.")
mcq("t03", "Si cambias la elección de apoyos isostáticos de una estructura con cargas autoequilibradas, ¿qué cambia?",
    ["Las tensiones", "Solo los desplazamientos, en un movimiento de sólido rígido", "Las reacciones, que dejan de ser nulas", "Nada en absoluto"], 1,
    "Las deformaciones y las tensiones no dependen de los modos rígidos. Las reacciones siguen siendo nulas y solo cambia el campo de desplazamientos.")
mcq("t03", "Una barra horizontal 1–2 sufre en el nodo 2 un desplazamiento vertical pequeño $v$, con el nodo 1 fijo. Su deformación es…",
    ["$v/l$", "0 en primer orden", "$v^2/l$", "$-v/l$"], 1,
    "$\\varepsilon = \\mathbf n\\cdot(\\mathbf u_2-\\mathbf u_1)/l$ con $\\mathbf n=(1,0)$: un desplazamiento perpendicular no alarga la barra en teoría lineal (solo en segundo orden, $v^2/2l^2$).")
explain("t03", "Deduce la matriz de rigidez de una barra 2D en ejes globales.",
        "<p>En ejes locales $\\mathbf K'^e$ solo tiene rigidez axial $EA/l$. Los desplazamientos y las fuerzas se transforman con $\\mathbf u' = \\mathbf R\\mathbf u$ y $\\mathbf F' = \\mathbf R\\mathbf F$ "
        "(con $c,s$ de la barra). Entonces $\\mathbf F = \\mathbf R^T\\mathbf F' = \\mathbf R^T\\mathbf K'\\mathbf R\\,\\mathbf u$, es decir, $\\mathbf K^e = \\mathbf R^T\\mathbf K'\\mathbf R = \\frac{EA}{l}\\begin{bmatrix}\\mathbf n\\mathbf n^T&-\\mathbf n\\mathbf n^T\\\\-\\mathbf n\\mathbf n^T&\\mathbf n\\mathbf n^T\\end{bmatrix}$ "
        "con $\\mathbf n=(c,s)$. Lo mismo se obtiene por invariancia del trabajo interno.</p>",
        ["K' local solo axial", "u' = R u y F' = R F", "K = Rᵀ K' R", "bloques ±n nᵀ"])
explain("t03", "¿Qué es un mecanismo y cómo lo detectarías en tu programa?",
        "<p>Es una estructura (o una parte de ella) que puede moverse sin deformar ninguna barra porque le faltan barras o apoyos ($h<0$ o una mala disposición). "
        "Entonces $\\mathbf K_{LL}$ es singular: <code>rcond</code> ≈ 0, MATLAB avisa de «matrix is singular» o aparecen desplazamientos enormes. Se detecta con el rango de $\\mathbf K_{LL}$ o con "
        "sus autovalores nulos, cuyos autovectores son los modos.</p>",
        ["movimiento sin deformación", "K_LL singular", "rcond / rango / autovalores nulos", "h < 0 no es la única causa"])
explain("t03", "¿Cómo incluyes el peso propio de las barras y una aceleración de sólido rígido en un cálculo estático?",
        "<p>Peso: $\\rho gAl$ por barra, la mitad a cada nodo (fuerzas nodales equivalentes con interpolación lineal). Aceleración: problema cuasiestático con d'Alembert, "
        "sumando la fuerza de inercia $-\\rho Al\\,\\mathbf a/2$ en cada nodo (y $-m\\mathbf a$ en las masas concentradas). Con las cargas, el peso y la inercia autoequilibrados, basta con apoyos "
        "isostáticos que eliminen los modos rígidos, y las reacciones deben salir nulas.</p>",
        ["ρgAl/2 por nodo", "d'Alembert −m a", "cargas autoequilibradas", "reacciones nulas como comprobación"])
c_, s_ = math.cos(math.radians(30)), math.sin(math.radians(30))
num("t03", "Barra a 30° con $EA/l = 10^4$ N/mm. ¿Cuánto vale el término $K_{12}$ de $\\mathbf K^e$ (N/mm)?",
    1e4 * c_ * s_, "N/mm", f"$K_{{12}} = \\frac{{EA}}{{l}}cs = 10^4\\cos30°\\sin30° = {1e4*c_*s_:.0f}$ N/mm.")
P_, h_, L_ = 10.0, 1.0, 4.0
th = math.atan(2 * h_ / L_)
num("t03", f"Triángulo isostático: nodos $(0,0)$, $({L_:.0f},0)$, $({L_/2:.0f},{h_:.0f})$ m, con una carga vertical de {P_:.0f} kN hacia abajo en el vértice superior. ¿Axil de la barra inferior (kN, tracción +)?",
    P_ * L_ / (4 * h_), "kN", f"$N_{{12}} = PL/(4h) = {P_:.0f}\\cdot{L_:.0f}/(4\\cdot{h_:.0f}) = {P_*L_/(4*h_):.1f}$ kN (tracción). Las diagonales llevan $-P/(2\\sin\\theta) = {-P_/(2*math.sin(th)):.2f}$ kN.")

# ---------------------------------------------------------------- t04
mcq("t04", "Al calentar ($\\Delta T>0$) una barra con los dos extremos bloqueados, su tensión es…",
    ["$+E\\alpha\\Delta T$ (tracción)", "$-E\\alpha\\Delta T$ (compresión)", "Nula", "$-\\alpha\\Delta T$"], 1,
    "$\\varepsilon = 0$, así que $\\sigma = E(\\varepsilon - \\alpha\\Delta T) = -E\\alpha\\Delta T$: la barra quiere alargarse y las paredes la comprimen.")
mcq("t04", "Una celosía isostática sufre un $\\Delta T$ uniforme con dos materiales distintos. ¿Qué tensiones aparecen?",
    ["Ninguna", "Solo en las barras del material con mayor $\\alpha$", "En todas", "Depende de la carga exterior"], 0,
    "En una estructura isostática los axiles se determinan solo por equilibrio. Sin cargas exteriores $N=0$: la dilatación se acomoda con desplazamientos.")
mcq("t04", "Después de resolver con deformación inicial, la tensión en cada barra es…",
    ["$E\\varepsilon$", "$\\sigma_0 + E\\varepsilon$", "$\\sigma_0$", "$E(\\varepsilon+\\varepsilon_0)$"], 1,
    "$\\sigma = E(\\varepsilon - \\varepsilon_0) = E\\varepsilon + \\sigma_0$, con $\\sigma_0 = -E\\varepsilon_0$. Olvidar $\\sigma_0$ es el error más típico.")
explain("t04", "Deduce las fuerzas nodales equivalentes de una deformación inicial en una barra 2D.",
        "<p>Axil: $p = k(u_2'-u_1') + A\\sigma_0$. En ejes locales, las fuerzas internas son $\\mathbf K'\\mathbf u' + A\\sigma_0[-1\\ 0\\ 1\\ 0]^T$. Al rotar a globales y pasar el término "
        "conocido al lado de las cargas: $\\mathbf K\\mathbf u = \\mathbf F^{ext} + \\mathbf f_0 + \\mathbf R$ con $\\mathbf f_0^e = -\\mathbf R^T A\\sigma_0[-1\\ 0\\ 1\\ 0]^T = A\\sigma_0[c\\ s\\ -c\\ -s]^T$. "
        "Al calentar ($\\sigma_0<0$), estas fuerzas separan los nodos.</p>",
        ["p = k Δu + Aσ0", "término conocido a la derecha", "rotar con Rᵀ", "σ0 = −EαΔT"])
explain("t04", "¿Por qué una estructura hiperestática puede no tener tensiones térmicas? Pon un ejemplo.",
        "<p>Las tensiones térmicas aparecen solo si la <strong>dilatación libre es incompatible</strong> con los apoyos o con la estructura. Ejemplos: una estructura de un solo material "
        "con $\\Delta T$ uniforme se dilata como una homotecia, y si los apoyos son compatibles con esa homotecia (por ejemplo, un punto fijo y apoyos deslizantes radiales respecto a él) no hay tensiones aunque sea "
        "hiperestática. En cambio, dos materiales con $\\alpha$ distinto unidos de forma redundante o una barra entre dos paredes sí tienen tensiones.</p>",
        ["compatibilidad de la dilatación libre", "homotecia con un solo material", "apoyos compatibles", "contraejemplo con α distintos"])
E_, a_, dT_ = 70e3, 23e-6, 60.0
num("t04", "Barra de aluminio ($E=70$ GPa, $\\alpha = 23\\times10^{-6}$ K⁻¹) empotrada en ambos extremos y calentada 60 °C. ¿$\\sigma$ (MPa)?",
    -E_ * a_ * dT_, "MPa", f"$\\sigma = -E\\alpha\\Delta T = -70\\,000\\cdot23\\times10^{{-6}}\\cdot60 = {-E_*a_*dT_:.1f}$ MPa (compresión).")
l1, l2, E1, E2, a1, a2, A1, A2, dT2 = 1.0, 1.0, 70e3, 200e3, 23e-6, 12e-6, 100.0, 100.0, 50.0
Nc = -dT2 * (a1 * l1 + a2 * l2) / (l1 / (E1 * A1) + l2 / (E2 * A2))
num("t04", "Barra de aluminio (1 m, $E=70$ GPa, $\\alpha=23\\times10^{-6}$) seguida de una de acero (1 m, $E=200$ GPa, $\\alpha=12\\times10^{-6}$), ambas de 100 mm², entre paredes rígidas y calentadas 50 °C. ¿Axil (kN)?",
    Nc / 1e3, "kN", f"$N = -\\dfrac{{\\Delta T(\\alpha_1l_1+\\alpha_2l_2)}}{{l_1/E_1A_1+l_2/E_2A_2}} = {Nc/1e3:.2f}$ kN.")
num("t04", "Una barra de 2 m de acero ($\\alpha = 12\\times10^{-6}$ K⁻¹), libre, se enfría 40 °C. ¿Cambio de longitud (mm)?",
    12e-6 * -40 * 2000, "mm", "$\\Delta l = \\alpha\\Delta T\\,l = 12\\times10^{-6}\\cdot(-40)\\cdot2000 = -0{,}96$ mm, sin tensión.")

# ---------------------------------------------------------------- t05
mcq("t05", "Si duplicas la longitud de una columna biarticulada, su carga crítica…",
    ["Se reduce a la mitad", "Se reduce a la cuarta parte", "No cambia", "Se duplica"], 1, "$P_{cr} = \\pi^2EI/l^2$.")
mcq("t05", "¿Qué inercia se usa en la fórmula de Euler?", ["$I_{\\max}$", "$I_{\\min}$", "$I_{xx}+I_{yy}$", "El momento polar $J$"], 1,
    "La columna pandea alrededor del eje de menor rigidez.")
mcq("t05", "Longitud efectiva de una columna empotrada-libre:", ["$l/2$", "$0{,}7l$", "$l$", "$2l$"], 3,
    "La ménsula equivale a media columna biarticulada de longitud $2l$: $P_{cr} = \\pi^2EI/(4l^2)$.")
mcq("t05", "¿Por qué no se revisa el pandeo de una barra traccionada?",
    ["Porque la tracción estabiliza la barra", "Porque su $I$ es mayor", "Sí se revisa", "Porque $E$ cambia"], 0,
    "El pandeo es una inestabilidad por compresión: una desviación lateral bajo tracción genera un momento que la endereza.")
explain("t05", "Deduce la carga crítica de Euler de una columna biarticulada.",
        "<p>Configuración desviada $v(z)$: $M = -Pv$ y $EIv'' = -Pv$, así que $v'' + \\mu^2v = 0$ con $\\mu^2 = P/EI$ y $v = A\\cos\\mu z + B\\sin\\mu z$. Con $v(0)=0$, $A=0$, y con $v(l)=0$, $B\\sin\\mu l = 0$. "
        "Para que exista solución no trivial, $\\mu l = n\\pi$, de donde $P_{cr} = n^2\\pi^2EI/l^2$; el primer modo es $n=1$. $B$ queda indeterminado: es equilibrio neutro.</p>",
        ["EI v'' = −P v", "solución armónica", "condiciones de contorno → sin μl = 0", "n = 1, B indeterminado"])
explain("t05", "En tu celosía, una barra comprimida tiene un FS de pandeo de 0,8. ¿Qué propones y por qué?",
        "<p>FS < 1 indica que pandea antes de alcanzar la carga, y la solución lineal deja de valer para esa barra. Hay que aumentar $\\sigma_{cr} = \\pi^2EI/(l^2A)$: "
        "(1) más inercia por unidad de área, con un tubo de mayor diámetro y pared delgada, porque $I/A = r^2$ crece; (2) acortar la longitud libre con un arriostramiento, que multiplica por 4 al dividir $l$ por 2; "
        "(3) un material con más $E$; o (4) cambiar la geometría para que esa barra trabaje a tracción. Con margen: FS ≥ 1,5 por imperfecciones.</p>",
        ["FS < 1: pandea", "aumentar r² = I/A", "arriostrar (l/2 → ×4)", "margen por imperfecciones"])
D, d, Ec, l = 20.0, 16.0, 70e3, 1500.0
I = pi / 64 * (D**4 - d**4)
num("t05", "Tubo de aluminio $D = 20$ mm, $d = 16$ mm, $E = 70$ GPa, biarticulado y de 1,5 m. ¿$P_{cr}$ (N)?",
    pi**2 * Ec * I / l**2, "N", f"$I = \\frac{{\\pi}}{{64}}(D^4-d^4) = {I:.0f}$ mm⁴; $P_{{cr}} = \\pi^2EI/l^2 = {pi**2*Ec*I/l**2:.0f}$ N.")
Dm, Em, lm = 3.0, 120e3, 1000.0
Am, Im = pi / 4 * Dm**2, pi / 64 * Dm**4
num("t05", "Varilla maciza de $D = 3$ mm, $E = 120$ GPa y 1 m de longitud, biarticulada. ¿$\\sigma_{cr}$ (MPa)?",
    pi**2 * Em * Im / (lm**2 * Am), "MPa", f"$\\sigma_{{cr}} = \\pi^2EI/(l^2A) = \\pi^2E(D/4)^2/l^2 = {pi**2*Em*Im/(lm**2*Am):.3f}$ MPa: prácticamente no resiste compresión, es un cable.")
num("t05", "Esbeltez de transición $\\lambda_t = \\pi\\sqrt{E/\\sigma_y}$ para un aluminio con $E = 70$ GPa y $\\sigma_y = 270$ MPa:",
    pi * math.sqrt(70e3 / 270), "", f"$\\lambda_t = \\pi\\sqrt{{70\\,000/270}} = {pi*math.sqrt(70e3/270):.1f}$. Por encima de este valor manda Euler.")

# ---------------------------------------------------------------- t06
mcq("t06", "¿Cuántos grados de libertad tiene el elemento viga 1D de Euler-Bernoulli?", ["2", "3", "4", "6"], 2,
    "Flecha y giro en cada uno de sus dos nodos: $[u_{y1},\\theta_1,u_{y2},\\theta_2]$.")
mcq("t06", "Fuerzas nodales equivalentes de una carga uniforme $q$ en un elemento de longitud $l$:",
    ["$[ql/2,\\ 0,\\ ql/2,\\ 0]$", "$[ql/2,\\ ql^2/12,\\ ql/2,\\ -ql^2/12]$", "$[ql,\\ 0,\\ 0,\\ 0]$", "$[ql/3,\\ ql^2/6,\\ ql/3,\\ -ql^2/6]$"], 1,
    "Son las fuerzas consistentes (mismo trabajo virtual). Los momentos $\\pm ql^2/12$ son los de empotramiento perfecto.")
mcq("t06", "Voladizo con una carga puntual en la punta modelado con un solo elemento viga. La flecha en la punta es…",
    ["Exacta", "Aproximada, con un error del 25 %", "Nula", "Depende de la malla"], 0,
    "Sin carga en el vano, la elástica exacta es cúbica, y la interpolación de Hermite la reproduce exactamente.")
mcq("t06", "Con el postproceso $\\mathbf K^e\\mathbf u^e$ y carga distribuida, el diagrama de cortante por elemento es…",
    ["Exacto", "Constante a trozos (escalonado)", "Parabólico", "Cúbico"], 1,
    "La derivada tercera de una cúbica es constante: el cortante sale constante por elemento y el momento, lineal. Convergen al refinar.")
explain("t06", "¿Por qué el elemento viga usa polinomios cúbicos (Hermite)?",
        "<p>Hay 4 condiciones nodales ($u$ y $\\theta=u'$ en cada nodo), así que hacen falta 4 coeficientes. Además, la solución homogénea de $EIw''''=0$ es cúbica: sin carga en el vano el elemento es "
        "exacto. Las funciones de Hermite garantizan continuidad $C^1$ (flecha y giro), que es lo que exige la energía de flexión, con $w''$ al cuadrado.</p>",
        ["4 GDL → 4 coeficientes", "EI w'''' = 0 → cúbica", "continuidad C1", "exacto con cargas nodales"])
explain("t06", "¿Cómo estudias la convergencia de tu modelo de vigas si no tienes solución analítica?",
        "<p>Se toma como referencia una malla muy fina y se calcula el error relativo de una magnitud (la flecha en la punta) para mallas cada vez más finas. Se representa en "
        "<strong>log-log</strong> frente al tamaño $h$; la pendiente es el orden de convergencia. Con fuerzas consistentes exactas los valores nodales serían exactos. Si la carga se aproxima por su media por "
        "elemento, el error viene de esa aproximación y baja con $h$ (pendiente ≈ 2). Hay que comprobar también que la referencia está convergida.</p>",
        ["malla fina como referencia", "error relativo", "log-log, pendiente = orden", "origen del error: carga media por elemento"])
explain("t06", "Explica el convenio de signos de cortante y momento del curso y cómo se obtienen de $\\mathbf K^e\\mathbf u^e$.",
        "<p>$M = EIw''$, $dM/dx = -S$ y $dS/dx = -q$. En cada elemento, $\\hat{\\mathbf F}^e = \\mathbf K^e\\mathbf u^e$ y, según la guía, "
        "$F_y(e,1) = -\\hat F_1$, $F_y(e,2) = \\hat F_3$, $M_z(e,1) = -\\hat F_2$, $M_z(e,2) = \\hat F_4$: en el nodo 1 la fuerza sobre el elemento tiene signo opuesto al esfuerzo interno de la sección. "
        "Comprobación: un voladizo con carga $P$ hacia arriba en la punta tiene $M(0) = PL > 0$.</p>",
        ["M = EI w''", "dM/dx = −S, dS/dx = −q", "signos de la guía", "comprobación en voladizo"])
Pb, Lb, EIb = 1000.0, 2.0, 2e5
num("t06", "Voladizo de 2 m con $EI = 2\\times10^5$ N·m² y 1 kN en la punta. ¿Magnitud de la flecha en la punta (mm)?",
    Pb * Lb**3 / (3 * EIb) * 1e3, "mm", f"$\\delta = PL^3/(3EI) = 1000\\cdot8/(6\\times10^5) = {Pb*Lb**3/(3*EIb)*1e3:.2f}$ mm.")
qb = 500.0
num("t06", "Mismo voladizo ($L = 2$ m, $EI = 2\\times10^5$ N·m²) con una carga uniforme de 500 N/m. ¿Magnitud de la flecha en la punta (mm)?",
    qb * Lb**4 / (8 * EIb) * 1e3, "mm", f"$\\delta = qL^4/(8EI) = 500\\cdot16/(1{{,}}6\\times10^6) = {qb*Lb**4/(8*EIb)*1e3:.2f}$ mm.")
num("t06", "Elemento de 0,5 m con carga uniforme de 2 kN/m. ¿Momento nodal equivalente en el primer nodo (N·m)?",
    2000 * 0.5**2 / 12, "N·m", "$ql^2/12 = 2000\\cdot0{,}25/12 = 41{,}7$ N·m.")

# ---------------------------------------------------------------- t07
mcq("t07", "En flexión pura, el eje neutro pasa por…", ["El centro de cortante", "El centroide", "La fibra más alejada", "El centro de presiones"], 1,
    "El axil nulo exige $\\int\\sigma\\,dA = 0$ y, con $\\sigma$ lineal, el eje neutro pasa por el centroide.")
mcq("t07", "¿Cuándo es nulo $I_{xy}$?", ["Siempre", "Cuando $x$ o $y$ es eje de simetría", "Solo en secciones cerradas", "Cuando $I_{xx} = I_{yy}$"], 1,
    "Por simetría, las contribuciones $xy\\,dA$ se cancelan dos a dos.")
mcq("t07", "En flexión asimétrica, el eje neutro…", ["Es perpendicular al plano del momento", "En general no es perpendicular al plano del momento", "Coincide con el eje $x$", "No pasa por el centroide"], 1,
    "Solo es perpendicular si el momento actúa según un eje principal.")
mcq("t07", "Con el convenio del curso, en una sección con ejes principales $x, y$ sobre la que actúa <strong>solo</strong> $M_y>0$ ($M_x=0$), las fibras con $x>0$ están a…",
    ["tracción", "compresión", "nada", "cortante"], 1, "$\\sigma_z = M_xy/I_{xx} - M_yx/I_{yy}$: con $M_y>0$ y $x>0$, $\\sigma<0$.")
explain("t07", "Escribe la fórmula general de la tensión de flexión y deduce el caso simétrico.",
        "$$\\sigma_z = -\\frac{M_yI_{xx}+M_xI_{xy}}{I_{xx}I_{yy}-I_{xy}^2}\\,x + \\frac{M_xI_{yy}+M_yI_{xy}}{I_{xx}I_{yy}-I_{xy}^2}\\,y$$"
        "<p>($x$, $y$ centroidales; momentos según la mano derecha con $z$ a lo largo de la viga). Se obtiene imponiendo $\\sigma = ax + by$ (secciones planas) con "
        "$M_x = \\int\\sigma y\\,dA$ y $M_y = -\\int\\sigma x\\,dA$. Con $I_{xy}=0$ queda $\\sigma_z = M_xy/I_{xx} - M_yx/I_{yy}$.</p>",
        ["σ lineal en x, y", "M_x = ∫σy dA, M_y = −∫σx dA", "fórmula general", "I_xy = 0 → caso simétrico"])
explain("t07", "¿Cómo encuentras el punto más solicitado de una sección en flexión asimétrica?",
        "<p>(1) Centroide e inercias $I_{xx}$, $I_{yy}$, $I_{xy}$ (Steiner). (2) $\\sigma_z(x,y)$ con la fórmula general. (3) Eje neutro: $y/x = (M_yI_{xx}+M_xI_{xy})/(M_xI_{yy}+M_yI_{xy})$. "
        "(4) El máximo está en el punto más alejado del <em>eje neutro</em> (no del eje $x$). En la Z del ejemplo del curso (alas $h/2$, solo $M_x$) resulta estar en las uniones alma-ala; con otras proporciones o con $M_y$ puede estar en las puntas.</p>",
        ["propiedades de la sección", "fórmula general", "eje neutro", "punto más alejado del eje neutro"])
h_, t_, Mx = 200.0, 8.0, 10e6
Ixx = t_ * h_**3 / 3
num("t07", "Sección en Z (alma $h = 200$ mm, alas $h/2$, $t = 8$ mm, pared delgada) con $M_x = 10$ kN·m. ¿Tensión máxima (MPa)? Usa $\\sigma_{\\max} = 3{,}43\\,M_x/(th^2)$.",
    (6 / 7) * 4 * Mx / (t_ * h_**2), "MPa", f"Por el ejemplo del curso: $\\sigma = \\frac{{M_x}}{{th^3}}(6{{,}}86y - 10{{,}}3x)$, con el máximo en $(0, h/2)$: $3{{,}}43\\,M_x/(th^2) = {(6/7)*4*Mx/(t_*h_**2):.1f}$ MPa.")
b_, hr = 50.0, 100.0
num("t07", "Rectángulo macizo $b = 50$ mm × $h = 100$ mm con $M_x = 5$ kN·m (flexión de canto). ¿$\\sigma_{\\max}$ (MPa)?",
    5e6 * (hr / 2) / (b_ * hr**3 / 12), "MPa", f"$\\sigma = M c/I = 5\\times10^6\\cdot50/(50\\cdot100^3/12) = {5e6*(hr/2)/(b_*hr**3/12):.0f}$ MPa.")
num("t07", "El mismo rectángulo de 50×100 mm girado 90° (flexión de plano, con canto 50 mm). ¿Factor por el que se multiplica $\\sigma_{\\max}$?",
    (hr / b_), "", "$\\sigma = 6M/(bh^2)$: al intercambiar $b$ y $h$ el cociente vale $h/b = 2$.")
Ixx2, Iyy2, Ixy2 = 21.333e6, 5.333e6, 8.0e6
alpha = 0.5 * math.degrees(math.atan2(-2 * Ixy2, Ixx2 - Iyy2))
num("t07", "Una sección tiene $I_{xx} = 21{,}33$, $I_{yy} = 5{,}33$ e $I_{xy} = 8{,}00$ ($\\times10^6$ mm⁴). ¿Ángulo $\\alpha\\in(-45°,45°]$ del eje principal más próximo a $x$, con $\\tan2\\alpha = -2I_{xy}/(I_{xx}-I_{yy})$?",
    alpha, "°", f"$\\tan2\\alpha = -16/16 = -1$, así que $\\alpha = {alpha:.1f}°$.", tol=0.03)

# ---------------------------------------------------------------- t08
mcq("t08", "En la aproximación de pared delgada se desprecian…", ["Los términos en $t$", "Los términos en $t^2$, $t^3$", "Los términos de Steiner", "Las alas"], 1,
    "Se trabaja con la línea media; la inercia propia $Lt^3/12$ de una pared respecto a su eje longitudinal es despreciable.")
mcq("t08", "Inercia de un tubo circular de pared delgada (radio medio $r$, espesor $t$):", ["$\\pi r^4/4$", "$\\pi r^3t$", "$2\\pi r^3t$", "$\\pi r^2t$"], 1,
    "$I = \\int y^2t\\,ds = tr^3\\int_0^{2\\pi}\\sin^2\\theta\\,d\\theta = \\pi r^3t$.")
mcq("t08", "Para una pared inclinada un ángulo $\\theta$, de longitud $a$, $I_{xx}$ vale…", ["$ta^3\\cos^2\\theta/12$", "$ta^3\\sin^2\\theta/12$", "$ta^3/12$", "$ta^3\\sin2\\theta/24$"], 1,
    "$y = s\\sin\\theta$, así que $I_{xx} = \\int_{-a/2}^{a/2}s^2\\sin^2\\theta\\,t\\,ds$.")
explain("t08", "¿Cómo calcularías el centroide y $I_{xx}$ de un fuselaje circular de pared delgada con un suelo recto (una cuerda) por debajo del centro?",
        "<p>(1) Longitud de la cuerda: a una distancia $h_f$ por debajo del centro, la semicuerda es $\\sqrt{R^2-h_f^2}$. (2) Áreas: círculo $2\\pi Rt_s$ y suelo $b\\,t_f$. (3) Centroide vertical: "
        "$\\bar y = \\sum A_iy_i/\\sum A_i$ (el círculo en $y=0$ y el suelo en $y=-h_f$). (4) Inercias propias: círculo $\\pi R^3t_s$, suelo ≈ 0 (horizontal y de pared delgada). (5) Steiner: "
        "$I_{xx} = \\pi R^3t_s + 2\\pi Rt_s\\bar y^2 + b\\,t_f(h_f+\\bar y)^2$, o, de forma equivalente, $\\sum(I_i + A_iy_i^2) - A\\bar y^2$.</p>",
        ["longitud de la cuerda", "áreas y centroide", "inercias propias", "Steiner"])
explain("t08", "¿Qué es la idealización en largueros (booms) y para qué sirve?",
        "<p>Se concentra el área que resiste tensión normal en puntos (booms): los larguerillos más una parte del revestimiento, $B = \\frac{t_Db}{6}(2+\\sigma_2/\\sigma_1)$. El revestimiento queda "
        "solo a cortante. Las integrales de la sección se convierten en sumas ($I_{xx} = \\sum B_iy_i^2$) y el flujo de cortante es constante entre booms, con saltos en cada uno. Simplifica mucho el análisis de "
        "las secciones semimonocasco.</p>",
        ["área concentrada", "revestimiento solo a cortante", "fórmula de B", "sumas en lugar de integrales"])
R_, ts_ = 2000.0, 3.0
num("t08", "Tubo de pared delgada $R = 2$ m (radio medio) y $t = 3$ mm. ¿$I_{xx}$ en m⁴?",
    pi * (R_ / 1e3)**3 * ts_ / 1e3, "m⁴", f"$\\pi R^3t = \\pi\\cdot8\\cdot0{{,}}003 = {pi*8*0.003:.4f}$ m⁴.")
num("t08", "Semicírculo de pared delgada: ¿a qué distancia del centro (en múltiplos de $r$) está su centroide?", 2 / pi, "r",
    "$\\bar x = -2r/\\pi \\approx -0{,}637\\,r$ (distancia $2r/\\pi$).")
a8, t8 = 100.0, 2.0
num("t08", "Pared de 100 mm × 2 mm inclinada 30°. ¿$I_{xx}$ respecto a su centroide (mm⁴)?",
    t8 * a8**3 / 12 * math.sin(math.radians(30))**2, "mm⁴", f"$ta^3\\sin^2\\theta/12 = 2\\cdot10^6\\cdot0{{,}}25/12 = {t8*a8**3/12*0.25:.0f}$ mm⁴.")

# ---------------------------------------------------------------- t09
mcq("t09", "En el borde libre de una sección abierta, el flujo de cortante vale…", ["El máximo", "Cero", "$S_y/h$", "$q_{s,0}$"], 1,
    "No hay material más allá que pueda transmitir cortante: $q = 0$, y es el origen natural de la integración.")
mcq("t09", "¿Dónde es máximo $q$ en el alma de un canal bajo $S_y$?", ["En las uniones con las alas", "En el eje neutro", "En los bordes libres", "Es constante"], 1,
    "$q$ es proporcional al momento estático de la parte recorrida, que es máximo al llegar al eje neutro.")
mcq("t09", "El centro de cortante de una sección en L (dos alas que se cortan) está…", ["En el centroide", "En la esquina donde se cortan las alas", "Fuera de la sección, detrás del alma", "En la punta de un ala"], 1,
    "Los flujos van a lo largo de las alas, y todas sus líneas de acción pasan por la esquina: el momento respecto a ese punto es nulo.")
mcq("t09", "En una sección cerrada, ¿por qué hace falta una ecuación adicional?",
    ["Porque no hay borde libre: $q(0) = q_{s,0}$ es desconocido", "Porque $I_{xy}\\neq0$", "Por la torsión de Saint-Venant", "No hace falta"], 0,
    "Se corta la sección, se calcula $q_{open}$ y $q_{s,0}$ se obtiene del equilibrio de momentos (con $\\oint\\mathbf r\\times\\mathbf t\\,ds = 2A$).")
mcq("t09", "En un tubo circular de pared delgada con cortante $S$, $\\tau_{\\max}$ vale…", ["$S/A$", "$2S/A$", "$1{,}5\\,S/A$", "$S/(2A)$"], 1,
    "$q_{\\max} = S/(\\pi r)$ en el eje neutro, así que $\\tau = S/(\\pi rt) = 2S/A$ con $A = 2\\pi rt$.")
explain("t09", "Deduce la ecuación $\\partial q/\\partial s = -t\\,\\partial\\sigma_z/\\partial z$ y la fórmula del flujo en una sección abierta.",
        "<p>Equilibrio en $z$ de un elemento de pared $\\delta s\\times\\delta z$: $\\frac{\\partial q}{\\partial s}\\delta s\\delta z + \\frac{\\partial\\sigma_z}{\\partial z}t\\,\\delta s\\delta z = 0$. Con la fórmula de flexión, "
        "$S_y = \\partial M_x/\\partial z$ y $S_x = -\\partial M_y/\\partial z$, se integra desde el borde libre ($q=0$): "
        "$q(s) = -\\frac{S_xI_{xx}-S_yI_{xy}}{D}\\int_0^s tx\\,ds - \\frac{S_yI_{yy}-S_xI_{xy}}{D}\\int_0^s ty\\,ds$.</p>",
        ["equilibrio longitudinal del elemento", "derivar σ_z con S = dM/dz", "integrar desde q = 0", "momentos estáticos"])
explain("t09", "Define el centro de cortante y explica cómo lo calculas.",
        "<p>Es el punto por el que debe pasar la carga cortante para que la sección no gire (sin torsión). Se calcula $q(s)$ con la carga supuesta en el centro de cortante y se igualan momentos: "
        "$S_y\\,\\xi_S = \\oint r_\\perp q\\,ds$ respecto a un punto conveniente (donde se cortan paredes). Está sobre los ejes de simetría y en el cruce de las paredes de L y T. En un canal queda fuera, detrás del alma.</p>",
        ["sin torsión", "momentos de q = momento de S", "punto conveniente", "simetrías y casos típicos"])
explain("t09", "¿Cómo combinas flexión y cortante para localizar el punto crítico de una sección? ¿Qué criterio usas?",
        "<p>En cada punto de la pared hay $\\sigma_z$ (flexión, máxima lejos del eje neutro) y $\\tau = q/t$ (cortante, máxima cerca del eje neutro). Con von Mises, "
        "$\\sigma_{VM} = \\sqrt{\\sigma^2+3\\tau^2}$, se recorre la sección (y las secciones candidatas: la de momento máximo y la de cortante máximo) buscando el máximo. Hay que tener en cuenta que en una sección "
        "cerrada multicelular $q$ requiere ecuaciones adicionales.</p>",
        ["σ y τ en el mismo punto", "von Mises √(σ²+3τ²)", "barrido de la sección", "secciones candidatas"])
Sy, hc, bc = 10000.0, 200.0, 100.0
num("t09", "Canal de espesor uniforme, alma $h = 200$ mm y alas $b = 100$ mm. ¿Distancia del centro de cortante al alma (mm)?",
    3 * bc**2 / (hc + 6 * bc), "mm", f"$\\xi_S = 3b^2/(h+6b) = 30\\,000/800 = {3*bc**2/(hc+6*bc):.1f}$ mm, por fuera del alma.")
num("t09", "En ese canal, con $S_y = 10$ kN, ¿flujo en la unión ala-alma (N/mm)?",
    6 * Sy * bc / (hc * (hc + 6 * bc)), "N/mm", f"$q_1 = 6S_yb/[h(h+6b)] = {6*Sy*bc/(hc*(hc+6*bc)):.1f}$ N/mm.")
r9, t9, S9 = 100.0, 2.0, 20000.0
num("t09", "Tubo de pared delgada de radio medio 100 mm y $t = 2$ mm, con $S = 20$ kN. ¿$\\tau_{\\max}$ (MPa)?",
    S9 / (pi * r9 * t9), "MPa", f"$\\tau_{{\\max}} = S/(\\pi rt) = 20\\,000/(\\pi\\cdot200) = {S9/(pi*r9*t9):.1f}$ MPa.")
num("t09", "Von Mises con $\\sigma = 120$ MPa y $\\tau = 40$ MPa:", math.sqrt(120**2 + 3 * 40**2), "MPa",
    f"$\\sqrt{{120^2+3\\cdot40^2}} = {math.sqrt(120**2+3*40**2):.1f}$ MPa.")

# ---------------------------------------------------------------- assignments (method only, no graded results)
explain("A1", "Trabajo 1: ¿cómo has modelado el muelle entre los nodos 4 y 13?",
        "<p>Como un elemento barra más, cuya rigidez axial $EA/L$ es igual a $k$ (por ejemplo, $E = kL$ y $A = 1$, sin dilatación térmica). Su «tensión» de salida es entonces la fuerza del muelle. "
        "Se ensambla como cualquier barra con su dirección $\\mathbf n$.</p>",
        ["barra equivalente EA/L = k", "sin α", "salida = fuerza", "ensamblaje normal"])
explain("A1", "Trabajo 1: ¿cómo impones los desplazamientos $\\delta$ de los nodos 1 y 11 y qué grados de libertad quedan libres?",
        "<p>En <code>fixNod</code>: nodo 3 ($x$ e $y$) = 0, $u_{y,1} = +\\delta$, $u_{y,11} = -\\delta$ (con los sentidos de las flechas). Los desplazamientos horizontales de 1 y 11 quedan libres. "
        "En la solución, $\\mathbf u_R\\neq0$ entra en $\\mathbf F_L - \\mathbf K_{LR}\\mathbf u_R$, y las reacciones en 1 y 11 son las fuerzas necesarias para imponer $\\delta$.</p>",
        ["fixNod con valor", "signos de δ", "x libres en 1 y 11", "−K_LR u_R"])
explain("A1", "Trabajo 1: sin desplazamientos impuestos, ¿qué apoyos usas y por qué?",
        "<p>Al quitar $u_{y,1}$ y $u_{y,11}$ queda solo el nodo 3 articulado, que deja libre el giro rígido alrededor de 3, y $\\mathbf K_{LL}$ es singular. Se añade <em>un</em> apoyo que impida ese giro sin "
        "sobrecoaccionar (por ejemplo, $u_y$ de un nodo alejado horizontalmente de 3). Es un apoyo isostático: cualquier elección válida da las mismas tensiones y desplazamientos que difieren en un giro rígido.</p>",
        ["giro rígido alrededor de 3", "K_LL singular", "un apoyo extra isostático", "independencia de la elección"])
explain("A1", "Trabajo 1: ¿cómo evalúas el riesgo de pandeo de cada barra?",
        "<p>Para cada barra comprimida, $\\sigma_{cr} = \\pi^2EI/(L^2A)$ con sus propias $E, I, A, L$ (biarticulada). El factor de seguridad es $\\sigma_{cr}/|\\sigma|$; si es menor que 1, la barra pandea. "
        "Las barras traccionadas no pandean. Para las críticas se proponen mejoras: más $I$, arriostramiento o menos carga.</p>",
        ["σcr por barra", "solo comprimidas", "FS = σcr/|σ|", "propuesta de mejora"])
explain("A1", "Trabajo 1: ¿qué comprobaciones independientes harías de tus resultados?",
        "<p>Equilibrio global (suma de reacciones nula sin cargas exteriores); equilibrio de momentos de cada subestructura respecto al nodo fijo; un segundo código o un cálculo a mano en un caso "
        "simple; el campo de dilatación libre analítico para el caso térmico; y simetrías de la geometría.</p>",
        ["ΣR = 0", "momentos respecto al nodo fijo", "código independiente", "dilatación libre analítica"])
explain("A2", "Trabajo 2: ¿cómo obtienes $L$, $D$ y $T$ antes de resolver la celosía?",
        "<p>Con equilibrio de sólido rígido de toda el ala delta (descenso a velocidad constante, así que no hay aceleración): $\\sum F_x = 0$, $\\sum F_z = 0$ y $\\sum M_y = 0$ respecto a un punto conveniente, "
        "con el peso de la masa, el peso de las barras (calculado con $\\rho$, $A$ y $l$ de cada una), la sustentación y la resistencia en los nodos del intradós/extradós, y $T$ en los nodos 1-2. Son tres ecuaciones "
        "con tres incógnitas; los brazos salen de las coordenadas de los nodos.</p>",
        ["sólido rígido, a = 0", "ΣFx, ΣFz, ΣMy", "peso propio incluido", "3 incógnitas"])
explain("A2", "Trabajo 2: ¿qué grados de libertad prescribes y qué esperas en las reacciones?",
        "<p>Como las cargas están en equilibrio, solo hay que eliminar los 6 modos rígidos en 3D: por ejemplo, un nodo con $u_x=u_y=u_z=0$, otro con dos componentes y un tercero con una, elegidos para no "
        "estar alineados. Las reacciones deben salir prácticamente nulas: es la prueba de que $L$, $D$ y $T$ están bien calculados. Si no lo son, el equilibrio global está mal.</p>",
        ["6 modos rígidos en 3D", "apoyos isostáticos no alineados", "reacciones ≈ 0", "diagnóstico del equilibrio"])
explain("A2", "Trabajo 2: ¿cómo incluyes la ráfaga (aumento del 15 % de la carga aerodinámica)?",
        "<p>Las cargas aerodinámicas aumentan y deja de haber equilibrio. Se calcula la fuerza extra del piloto $T'$ que anula el momento respecto al centro de masas y, con la fuerza neta, la aceleración "
        "$a_x = \\sum F_x/m_{tot}$, $a_z = \\sum F_z/m_{tot}$. Con d'Alembert se añade en cada nodo $-m_i\\mathbf a$ (masas nodales del peso propio y de la carga), con lo que el sistema vuelve a estar autoequilibrado "
        "y se resuelve como un problema estático con los mismos apoyos isostáticos.</p>",
        ["+15 % en L y D", "T' para el momento", "a = F_net/m", "inercia −m a por nodo"])
explain("A2", "Trabajo 2: ¿por qué hay que vigilar el signo del axil en los cables?",
        "<p>Los cables (varillas muy finas, $\\sigma_{cr}$ casi nulo) solo pueden trabajar a tracción. Si el modelo lineal da compresión en un cable, en la realidad este se destensaría y la estructura cambiaría. "
        "Hay que comentarlo y, si hace falta, proponer una pretensión o un cambio de geometría.</p>",
        ["cable solo tracción", "σcr ≈ 0", "cable flojo cambia el modelo", "pretensión o rediseño"])
explain("A3", "Trabajo 3: ¿cómo calculas la carga de cola $L_t$ para que $M_z(0) = 0$?",
        "<p>Equilibrio de momentos respecto al empotramiento de todo el voladizo: $\\int_0^{L}(q(x) - \\lambda(x)g)\\,x\\,dx - M_{APU}g\\,L - L_t\\,L = 0$ (con los signos de las cargas: peso hacia abajo, sustentación hacia arriba "
        "y $L_t$ hacia abajo). Se integra a trozos (tramo constante y tramo lineal de la masa; coseno de la sustentación hasta $L_1$) y se despeja $L_t$.</p>",
        ["momento en el empotramiento", "integrales a trozos", "cargas puntuales en la punta", "despejar L_t"])
explain("A3", "Trabajo 3: ¿cómo discretizas las cargas distribuidas en el modelo de vigas?",
        "<p>En cada elemento se usa la carga media $\\bar q^e$ (sustentación menos peso, $q - \\lambda g$) y sus fuerzas consistentes $\\frac{\\bar ql}{2}[1, l/6, 1, -l/6]$. Las cargas puntuales (APU y $L_t$) "
        "se ponen en el nodo de la punta. Los nodos deben coincidir con $x = L_1$ para no mezclar tramos en un elemento.</p>",
        ["carga media por elemento", "fuerzas consistentes", "cargas puntuales en el nodo", "nodo en L1"])
explain("A3", "Trabajo 3: ¿qué esperas del estudio de convergencia y por qué?",
        "<p>El error de la flecha en la punta baja al refinar la malla, de forma aproximadamente lineal en log-log. La pendiente indica el orden. Con cargas consistentes exactas los valores nodales serían exactos, así que "
        "el error viene de aproximar $q(x)$ por su media por elemento (y de las discontinuidades de la carga). Se usa como referencia la malla de $h = 0{,}15625$ m.</p>",
        ["error decrece con h", "log-log y pendiente", "origen del error", "malla de referencia"])
explain("A3", "Trabajo 3: la sección tiene un suelo que corta el círculo. ¿Qué implica para el cálculo del cortante?",
        "<p>La sección es <strong>cerrada y de dos células</strong> (encima y debajo del suelo). En general hay dos incógnitas $q_{s,0}$: además del equilibrio de momentos hace falta la "
        "compatibilidad de giro, $\\theta' = \\frac{1}{2A_iG}\\oint_i \\frac{q}{t}ds$ igual en las dos células ($A_i$ = área de cada célula; en el suelo compartido el flujo es la diferencia de los dos). "
        "Pero la sección es simétrica respecto al eje vertical y el cortante actúa sobre ese eje: el flujo se anula donde las paredes cortan el eje (arriba, abajo y en el centro del suelo). "
        "Cortando por esos puntos cada mitad es una sección abierta ramificada y $q(s)$ sale directamente de la fórmula de sección abierta, sin compatibilidad.</p>",
        ["dos células", "compatibilidad con 1/(2A_i G)", "simetría: q = 0 en el eje", "mitades como secciones abiertas"])


def main(out):
    for i, q in enumerate(Q):
        q["id"] = f"{q['topic']}-{i:03d}"
    topics = {"t01": "1 · Introducción", "t02": "2 · Barras 1D", "t03": "3 · Celosías 2D/3D", "t04": "4 · Tensión térmica",
              "t05": "5 · Pandeo", "t06": "6 · Elemento viga", "t07": "7 · Flexión", "t08": "8 · Pared delgada", "t09": "9 · Cortante",
              "A1": "Trabajo 1 (métodos)", "A2": "Trabajo 2 (métodos)", "A3": "Trabajo 3 (métodos)"}
    json.dump({"topics": topics, "questions": Q}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    from collections import Counter
    print("questions:", len(Q), dict(Counter(q["topic"] for q in Q)), dict(Counter(q["type"] for q in Q)))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "quiz.json")
