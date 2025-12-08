'use client';

import dynamic from 'next/dynamic';

const ReactSwagger = dynamic(() => import('@components/swagger/ReactSwagger'), { ssr: false });

type Props = {
  spec: Record<string, any>;
};

const ReactSwaggerViewer = ({ spec }: Props) => {
  return (
    <section className="container">
      <ReactSwagger spec={spec} />
    </section>
  );
};

export default ReactSwaggerViewer;
