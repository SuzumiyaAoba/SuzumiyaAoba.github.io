interface MyLinkBoxProps {
  ids: string[];
}

export default function MyLinkBox({ ids }: MyLinkBoxProps) {
  if (!ids || ids.length === 0) {
    return null;
  }

  return (
    <>
      {ids.map((id, index) => (
        <div key={`mylinkbox-${id}-${index}`} data-vc_mylinkbox_id={id} />
      ))}
    </>
  );
}
