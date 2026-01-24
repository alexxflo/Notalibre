export default function Footer() {
  return (
    <footer className="py-6 mt-12">
      <div className="container mx-auto text-center text-slate-500">
        <p>&copy; {new Date().getFullYear()} SalvaFans. Todos los derechos reservados.</p>
        <p className="text-sm">Creado con 🦾 por Salvador.</p>
      </div>
    </footer>
  );
}
