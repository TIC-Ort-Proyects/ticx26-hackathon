import App from "@/components/tutorias/App";
import { I18nProvider } from "@/components/tutorias/i18n";
import { getSessionUser } from "@/lib/auth";
import { loadStateForUser } from "@/app/actions/data";

export default async function Page() {
  const user = await getSessionUser();
  const data = user ? await loadStateForUser(user.id) : null;
  return (
    <I18nProvider>
      <App initialAuthed={!!user} initialData={data} />
    </I18nProvider>
  );
}
