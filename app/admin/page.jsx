import { rpc } from "../../lib/db";
import { getSecret } from "../../lib/admin";
import { Login, Logout, CreateWave } from "../../components/AdminClient";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const secret = await getSecret();
  let list = null;
  if (secret) { try { list = await rpc("admin_list", { p_secret: secret }); } catch {} }
  if (!list) return (<><h1>Admin</h1><Login /></>);
  return (
    <>
      <div className="spread"><h1>Runden</h1><Logout /></div>
      <CreateWave />
      <div className="card">
        {list.length === 0 && <p className="muted">Noch keine Runden.</p>}
        {list.length > 0 && (
          <table>
            <thead><tr><th>Organisation</th><th>Runde</th><th>Antworten</th><th>Soll</th><th>Status</th></tr></thead>
            <tbody>
              {list.map((w) => (
                <tr key={w.id}>
                  <td><a href={`/admin/w/${w.id}`}>{w.org}</a></td><td>{w.wave}</td><td>{w.responses}</td><td>{w.soll}</td><td>{w.status === "open" ? "offen" : "geschlossen"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
