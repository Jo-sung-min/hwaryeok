export default function MyLoading() {
  return (
    <div className="container-page animate-pulse py-14 pb-24">
      <div className="h-5 w-28 rounded-full bg-[#d8c6b650]" />
      <div className="mt-5 h-12 w-72 max-w-full rounded-2xl bg-[#d8c6b65c]" />
      <div className="mt-12 h-72 rounded-[28px] bg-[#d8c6b647]" />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-28 rounded-2xl bg-[#d8c6b647]" />)}</div>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-96 rounded-[26px] bg-[#d8c6b647]" />)}</div>
    </div>
  );
}
