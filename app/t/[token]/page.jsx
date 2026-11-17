import { rpc } from "../../../lib/db";
import Survey from "../../../components/Survey";

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const { token } = await params;
  let info = null;
  try { info = await rpc("get_survey", { p_token: token }); } catch {}
  if (!info) return (<><h1>Link ungültig</h1><p>Dieser Link ist nicht bekannt. Bitte frag bei der Person nach, die ihn verschickt hat.</p></>);
  if (info.status !== "open") return (<><h1>Befragung geschlossen</h1><p>Diese Runde ist abgeschlossen. Danke fürs Interesse.</p></>);
  return <Survey token={token} info={info} />;
}
