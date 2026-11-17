import { rpc } from "../../../lib/db";
import SollForm from "../../../components/SollForm";

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const { token } = await params;
  let info = null;
  try { info = await rpc("get_lead", { p_token: token }); } catch {}
  if (!info) return (<><h1>Link ungültig</h1><p>Dieser Link ist nicht bekannt.</p></>);
  return <SollForm token={token} info={info} />;
}
