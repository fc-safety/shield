export default function Footer() {
  return (
    <footer className="px-2 py-6 sm:px-4 sm:py-12 grid grid-cols-1 md:grid-cols-3 bg-secondary text-secondary-foreground">
      <div className="col-span-full text-center">
        Copyright &copy; {new Date().getFullYear()} FC Safety
      </div>
    </footer>
  );
}
