// Common words for spelling suggestions in the translator.
export const WORDS = (
  "a about after again all also am an and any are as ask at away baby back bad bathroom be because bed been before best better big book both boy bring brother but by bye call can car cat chair child class clean cold come could cup dad day deaf did do doctor does dog done door down drink each eat end enough every family far fast father feel fine finish first food for friend from fun get girl give go good goodbye got great green happy has have he hear hello help her here hi him his home hot house how hungry hurt i if in is it job just keep kind know last later learn leave let like little live long look love make man many may me mean medicine meet mine milk mom more morning most mother move much music my name need never new next nice night no not now of off ok okay old on one only open or other our out pain pay people phone place play please question read ready red right room sad same say school see she should sick sign sister sit sleep slow small so some sorry start stay stop store student such sure talk teacher tell thank thanks that the their them then there they thing think this time tired to today together tomorrow too try understand up us use very wait walk want warm was water way we week well what when where which who why will with work would write wrong yes yesterday you your"
).split(" ");

export function suggestWords(prefix, max = 4) {
  const p = prefix.toLowerCase();
  if (!p) return [];
  return WORDS.filter((w) => w.startsWith(p) && w !== p).slice(0, max);
}