export default function Footer() {
  return (
    <footer className="bg-white py-6 mt-12 border-t">
      <div className="container mx-auto text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} SalvaFans. Todos los derechos reservados.</p>
        <p className="text-sm">Creado con ❤️ por Salvador.</p>
      </div>
    </footer>
  );
}
