import { getApiDocs } from '@libs/swagger/swagger';

import ReactSwaggerViewer from '@components/swagger/ReactSwaggerViewer';

const ApiDocPage = async () => {
  const spec = await getApiDocs('v1');

  return <ReactSwaggerViewer spec={spec} />;
};

export default ApiDocPage;
