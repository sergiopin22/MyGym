/**
 * Frases motivacionales — edita este archivo para agregar, quitar o cambiar textos.
 * Cada frase necesita un `id` único (no reutilices ids al borrar; usa el siguiente libre).
 */
export type MotivationCategory =
  | 'disciplina'
  | 'bajon'
  | 'jardin'
  | 'gym'
  | 'mentalidad'

export interface MotivationQuote {
  id: string
  text: string
  category: MotivationCategory
}

export const MOTIVATION_QUOTES: MotivationQuote[] = [
  // Disciplina y hábito (1-25)
  { id: 'q-001', category: 'disciplina', text: 'La disciplina no pregunta cómo te sientes hoy.' },
  { id: 'q-002', category: 'disciplina', text: 'No esperes ganas. Empieza y las ganas llegan después.' },
  { id: 'q-003', category: 'disciplina', text: 'Un día no cuenta. Una racha sí.' },
  { id: 'q-004', category: 'disciplina', text: 'Lo que repites te construye, no lo que sientes.' },
  { id: 'q-005', category: 'disciplina', text: 'El cuerpo obedece a quien no negocia.' },
  { id: 'q-006', category: 'disciplina', text: 'No se trata de motivación, se trata de calendario.' },
  { id: 'q-007', category: 'disciplina', text: 'Cada serie que evitas, la paga tu versión futura.' },
  { id: 'q-008', category: 'disciplina', text: 'La constancia es aburrida. Por eso funciona.' },
  { id: 'q-009', category: 'disciplina', text: 'No busques el momento perfecto, busca el próximo repetido.' },
  { id: 'q-010', category: 'disciplina', text: 'Entrenar cuando no quieres es donde se gana todo.' },
  { id: 'q-011', category: 'disciplina', text: 'Tu rutina no te pregunta si dormiste bien.' },
  { id: 'q-012', category: 'disciplina', text: 'La disciplina es la promesa que te cumples en silencio.' },
  { id: 'q-013', category: 'disciplina', text: 'Nadie ve el día 47. Todos ven el resultado.' },
  { id: 'q-014', category: 'disciplina', text: 'Hazlo mal, hazlo cansado, pero hazlo.' },
  { id: 'q-015', category: 'disciplina', text: 'El hábito no necesita inspiración, necesita horario.' },
  { id: 'q-016', category: 'disciplina', text: 'No decidas cada día. Decide una vez y repite.' },
  { id: 'q-017', category: 'disciplina', text: 'Lo simple sostenido vence a lo intenso ocasional.' },
  { id: 'q-018', category: 'disciplina', text: 'Presentarte ya es la mitad de la victoria.' },
  { id: 'q-019', category: 'disciplina', text: 'La versión disciplinada de ti no discute, actúa.' },
  { id: 'q-020', category: 'disciplina', text: 'Cero excusas no significa cero cansancio, significa ir igual.' },
  { id: 'q-021', category: 'disciplina', text: 'El gimnasio no arregla tu día, pero te arregla a ti.' },
  { id: 'q-022', category: 'disciplina', text: 'Cada repetición es un voto por quien quieres ser.' },
  { id: 'q-023', category: 'disciplina', text: 'No entrenas para sentirte bien ya, entrenas para sostenerte después.' },
  { id: 'q-024', category: 'disciplina', text: 'La pereza susurra razones. Ignórala y muévete.' },
  { id: 'q-025', category: 'disciplina', text: 'El progreso no aplaude, solo se acumula.' },
  // Actuar a pesar de bajón (26-50)
  { id: 'q-026', category: 'bajon', text: 'No necesitas estar bien para moverte, muévete y vas a estar mejor.' },
  { id: 'q-027', category: 'bajon', text: 'La tristeza no cancela la cita con el gimnasio.' },
  { id: 'q-028', category: 'bajon', text: 'Levanta el peso aunque hoy no puedas levantar el ánimo.' },
  { id: 'q-029', category: 'bajon', text: 'Puedes estar roto y aun así entrenar rota la rutina.' },
  { id: 'q-030', category: 'bajon', text: 'El dolor no pide permiso, tú tampoco se lo pidas para actuar.' },
  { id: 'q-031', category: 'bajon', text: 'Cuando no tengas fuerza para sentir, ten fuerza para hacer.' },
  { id: 'q-032', category: 'bajon', text: 'No esperes sanar para empezar. Empieza y eso también sana.' },
  { id: 'q-033', category: 'bajon', text: 'Un mal día no te define, un mal mes de faltar sí.' },
  { id: 'q-034', category: 'bajon', text: 'Muévete triste. El sudor no discrimina emociones.' },
  { id: 'q-035', category: 'bajon', text: 'A veces la disciplina es lo único que sostiene lo que se cae.' },
  { id: 'q-036', category: 'bajon', text: 'No tienes que sentir motivación, solo tienes que aparecer.' },
  { id: 'q-037', category: 'bajon', text: 'Cargar la barra puede pesar menos que cargar el día.' },
  { id: 'q-038', category: 'bajon', text: 'El cuerpo en movimiento distrae a la mente que se hunde.' },
  { id: 'q-039', category: 'bajon', text: 'Nadie dijo que había que estar feliz para ser fuerte.' },
  { id: 'q-040', category: 'bajon', text: 'Haz lo que puedas hoy, aunque sea menos que ayer.' },
  { id: 'q-041', category: 'bajon', text: 'Tu peor día entrenado vale más que tu mejor día en la cama.' },
  { id: 'q-042', category: 'bajon', text: 'No busques ánimo, busca acción. El ánimo llega tarde pero llega.' },
  { id: 'q-043', category: 'bajon', text: 'Estar triste y presentarte igual, eso es fortaleza real.' },
  { id: 'q-044', category: 'bajon', text: 'El silencio del cuarto se rompe con el ruido del gimnasio.' },
  { id: 'q-045', category: 'bajon', text: 'A veces avanzar es solo no quedarte quieto.' },
  { id: 'q-046', category: 'bajon', text: 'No necesitas ganas para respirar. Tampoco para entrenar.' },
  { id: 'q-047', category: 'bajon', text: 'Deja que el esfuerzo hable cuando las palabras no salgan.' },
  { id: 'q-048', category: 'bajon', text: 'Un paso torcido sigue siendo un paso hacia adelante.' },
  { id: 'q-049', category: 'bajon', text: 'La tristeza pasa. Los hábitos que sostuviste, se quedan.' },
  { id: 'q-050', category: 'bajon', text: 'Hazlo por la persona que serás cuando esto pase.' },
  // Jardín / siembra (51-65)
  { id: 'q-051', category: 'jardin', text: 'Cuida el jardín y las mariposas vendrán.' },
  { id: 'q-052', category: 'jardin', text: 'Nadie ve la raíz, todos ven la flor que tardó en crecer.' },
  { id: 'q-053', category: 'jardin', text: 'Riega hoy lo que no verás florecer hasta mañana.' },
  { id: 'q-054', category: 'jardin', text: 'No arranques la planta para ver si ya creció.' },
  { id: 'q-055', category: 'jardin', text: 'Lo que siembras en silencio, florece en público.' },
  { id: 'q-056', category: 'jardin', text: 'Un jardín descuidado no perdona, pero uno cuidado no olvida.' },
  { id: 'q-057', category: 'jardin', text: 'La cosecha llega para quien no dejó de regar.' },
  { id: 'q-058', category: 'jardin', text: 'No compares tu semilla con la flor de otro jardín.' },
  { id: 'q-059', category: 'jardin', text: 'El invierno también es parte del cultivo.' },
  { id: 'q-060', category: 'jardin', text: 'Cuida la raíz y el fruto se cuida solo.' },
  { id: 'q-061', category: 'jardin', text: 'No hay atajos para un jardín, solo constancia diaria.' },
  { id: 'q-062', category: 'jardin', text: 'Lo que hoy parece tierra vacía, mañana es raíz.' },
  { id: 'q-063', category: 'jardin', text: 'Las mariposas no llegan por decreto, llegan por trabajo.' },
  { id: 'q-064', category: 'jardin', text: 'Cultiva tu cuerpo como quien cultiva un jardín: todos los días.' },
  { id: 'q-065', category: 'jardin', text: 'La paciencia es el abono que nadie quiere comprar.' },
  // Gimnasio y esfuerzo (66-85)
  { id: 'q-066', category: 'gym', text: 'El hierro no miente, refleja exactamente lo que entrenaste.' },
  { id: 'q-067', category: 'gym', text: 'Cada repetición que duele es una que construye.' },
  { id: 'q-068', category: 'gym', text: 'No compitas con el de al lado, compite con tu última serie.' },
  { id: 'q-069', category: 'gym', text: 'El músculo se rompe en el gimnasio y se construye descansando.' },
  { id: 'q-070', category: 'gym', text: 'Suda hoy lo que no quieres cargar mañana.' },
  { id: 'q-071', category: 'gym', text: 'La barra no juzga tu día, solo tu esfuerzo.' },
  { id: 'q-072', category: 'gym', text: 'No cuentes los días difíciles, cuenta las series completadas.' },
  { id: 'q-073', category: 'gym', text: 'El descanso también es parte del entrenamiento, no una excusa.' },
  { id: 'q-074', category: 'gym', text: 'Fuerte no es no sentir peso, es cargarlo de todos modos.' },
  { id: 'q-075', category: 'gym', text: 'Cada gota de sudor es una decisión que ya tomaste.' },
  { id: 'q-076', category: 'gym', text: 'No entrenas para verte bien un día, entrenas para durar años.' },
  { id: 'q-077', category: 'gym', text: 'El progreso lento sigue siendo progreso.' },
  { id: 'q-078', category: 'gym', text: 'No hay técnica perfecta sin repetición imperfecta primero.' },
  { id: 'q-079', category: 'gym', text: 'El cuerpo cambia cuando la mente deja de negociar.' },
  { id: 'q-080', category: 'gym', text: 'Vas al gimnasio a construir algo que la pereza no puede tocar.' },
  { id: 'q-081', category: 'gym', text: 'La última repetición es la que realmente cuenta.' },
  { id: 'q-082', category: 'gym', text: 'No busques el peso máximo, busca la constancia máxima.' },
  { id: 'q-083', category: 'gym', text: 'El espejo miente menos después de meses, no después de un día.' },
  { id: 'q-084', category: 'gym', text: 'Fortaleza es volver aunque ayer no viste resultados.' },
  { id: 'q-085', category: 'gym', text: 'El cansancio de hoy es el músculo de mañana.' },
  // Mentalidad general (86-100)
  { id: 'q-086', category: 'mentalidad', text: 'No esperes sentirte listo, empieza y el "listo" llega caminando.' },
  { id: 'q-087', category: 'mentalidad', text: 'Tu disciplina de hoy es la excusa que le quitas al mañana.' },
  { id: 'q-088', category: 'mentalidad', text: 'Nadie recuerda los días fáciles, todos recuerdan los que aguantaste.' },
  { id: 'q-089', category: 'mentalidad', text: 'El esfuerzo constante vence al talento que descansa.' },
  { id: 'q-090', category: 'mentalidad', text: 'No se trata de ser el mejor, se trata de no rendirte.' },
  { id: 'q-091', category: 'mentalidad', text: 'Cada día que sostienes el hábito, te alejas de quien eras.' },
  { id: 'q-092', category: 'mentalidad', text: 'La versión fuerte de ti ya sabe que no hay atajos.' },
  { id: 'q-093', category: 'mentalidad', text: 'No mires cuánto falta, mira que sigues caminando.' },
  { id: 'q-094', category: 'mentalidad', text: 'El esfuerzo invisible de hoy es el resultado visible de mañana.' },
  { id: 'q-095', category: 'mentalidad', text: 'Actuar incómodo hoy es la comodidad de mañana.' },
  { id: 'q-096', category: 'mentalidad', text: 'No necesitas ser constante siempre, necesitas volver siempre.' },
  { id: 'q-097', category: 'mentalidad', text: 'Cada intento cuenta, aunque el resultado tarde en llegar.' },
  { id: 'q-098', category: 'mentalidad', text: 'La fuerza no se siente, se demuestra repitiendo.' },
  { id: 'q-099', category: 'mentalidad', text: 'No dejes que un mal momento borre un buen hábito.' },
  { id: 'q-100', category: 'mentalidad', text: 'Sigue. Eso es todo. Sigue.' },
]

const quoteById = new Map(MOTIVATION_QUOTES.map((q) => [q.id, q]))

export function getMotivationQuoteById(id: string): MotivationQuote | undefined {
  return quoteById.get(id)
}
