import GitHubDataManager from "../_components/github/data-manager";
import { getGithubData } from "../actions";
export const runtime = 'edge';
export default async function GitHubPage() {

    const initialData = await getGithubData();


  return (
      <GitHubDataManager initialData={initialData} />
  );
}