import AdminNavigation from "@/src/components/AdminNavigation";

type Props = {
  children: React.ReactNode;
};
export default function layout({ children }: Props) {
  return (
    <>
      <AdminNavigation />
      {children}
    </>
  );
}
