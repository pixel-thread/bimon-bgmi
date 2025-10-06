import { Button } from "@/src/components/ui/button";
import { FiShare2 } from "react-icons/fi";

interface ShareButtonProps {
  onClick: () => void;
}

export function ShareButton({ onClick }: ShareButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      className="share-button text-white hover:text-orange-500 hover:bg-gray-800/50 bg-gray-900/80 p-2 rounded-full relative"
    >
      <FiShare2 className="h-5 w-5" />
    </Button>
  );
}
