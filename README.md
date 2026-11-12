# Elements Resistents en l'Aeronàutica: estudio interactivo

Material de estudio **no oficial** para la asignatura 220375 *Elements Resistents en l'Aeronàutica* (MUEA, ESEIAAT-UPC):
teoría explicada con fórmulas, widgets interactivos (celosías, pandeo, vigas por elementos finitos, flexión asimétrica,
flujo de cortante), vídeos y un banco de preguntas tipo oral con simulacro y progreso guardado en el navegador.

Las explicaciones son originales; las referencias a diapositivas remiten a los apuntes de la asignatura en Atenea, que no
se reproducen aquí. No contiene soluciones de los trabajos evaluables antes de su fecha de entrega.

## Construir

```
python build.py          # genera _site/ (páginas + assets/quiz.json desde quiz/bank.py)
python -m http.server -d _site 8000
```

Se publica con GitHub Actions (`.github/workflows/pages.yml`) en cada push a `main`.

- `src/pages/*.html`: contenido de cada página (fragmento con cabecera `<!--meta ... -->`).
- `src/layout.html`: plantilla común. `src/assets/js/`: `fem.js` (solvers), `widgets.js`, `quiz.js`, `site.js`.
- `quiz/bank.py`: banco de preguntas; las respuestas numéricas se calculan, no se escriben a mano.
