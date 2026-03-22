import { CreateClient } from "./CreateClient";

export default function CreatePage({
  searchParams
}: {
  searchParams: { rematch?: string };
}) {
  const rematchId = searchParams?.rematch ?? null;
  return <CreateClient rematchId={rematchId} />;
}
