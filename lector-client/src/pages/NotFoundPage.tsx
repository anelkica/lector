import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-32 p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-6xl font-black text-main">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
        <Button asChild className="min-h-[44px] px-8">
          <Link to={ROUTES.home}>Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
