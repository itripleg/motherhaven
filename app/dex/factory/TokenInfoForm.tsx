import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { isAddress } from "viem";

interface TokenInfoFormProps {
  tokenInfo: {
    name: string;
    ticker: string;
    description: string;
    image: File | null;
    burnManager?: `0x${string}`;
  };
  onTokenInfoChange: (tokenInfo: TokenInfoFormProps["tokenInfo"]) => void;
}

export function TokenInfoForm({
  tokenInfo,
  onTokenInfoChange,
}: TokenInfoFormProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [burnManagerError, setBurnManagerError] = useState<string>("");

  useEffect(() => {
    if (tokenInfo.image) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(tokenInfo.image);
    } else {
      setPreviewUrl(null);
    }
  }, [tokenInfo.image]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "burnManager") {
      // Clear error if field is empty
      if (!value) {
        setBurnManagerError("");
        onTokenInfoChange({ ...tokenInfo, burnManager: undefined });
        return;
      }

      // Validate Ethereum address
      if (!value.startsWith("0x")) {
        setBurnManagerError("Address must start with 0x");
        onTokenInfoChange({ ...tokenInfo, [name]: value as `0x${string}` });
        return;
      }

      if (!isAddress(value)) {
        setBurnManagerError("Invalid Ethereum address");
        onTokenInfoChange({ ...tokenInfo, [name]: value as `0x${string}` });
        return;
      }

      setBurnManagerError("");
    }

    onTokenInfoChange({ ...tokenInfo, [name]: value });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onTokenInfoChange({ ...tokenInfo, image: e.dataTransfer.files[0] });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onTokenInfoChange({ ...tokenInfo, image: e.target.files[0] });
    }
  };

  const removeImage = () => {
    onTokenInfoChange({ ...tokenInfo, image: null });
    setPreviewUrl(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="name">Token Name</Label>
        <Input
          id="name"
          name="name"
          value={tokenInfo.name}
          onChange={handleChange}
          placeholder="Enter token name"
        />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="ticker">Ticker</Label>
        <Input
          id="ticker"
          name="ticker"
          value={tokenInfo.ticker}
          onChange={handleChange}
          placeholder="Enter ticker symbol"
        />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="description">Token Description</Label>
        <Textarea
          id="description"
          name="description"
          value={tokenInfo.description}
          onChange={handleChange}
          placeholder="Enter token description"
          rows={4}
          className="resize-none"
        />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="burnManager">Burn Manager Address (Optional)</Label>
        <Input
          id="burnManager"
          name="burnManager"
          value={tokenInfo.burnManager || ""}
          onChange={handleChange}
          placeholder="0x..."
          className={burnManagerError ? "border-red-500" : ""}
        />
        {burnManagerError && (
          <p className="text-sm text-red-500 mt-1">{burnManagerError}</p>
        )}
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="image">Token Image</Label>
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center ${
            dragActive ? "border-primary" : "border-gray-300"
          } relative`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="image"
            name="image"
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <label htmlFor="image" className="cursor-pointer">
            <div className="flex flex-col items-center">
              {previewUrl ? (
                <div className="relative w-full aspect-video max-w-xs">
                  {/* Image for large screens */}
                  <div className="hidden md:block relative w-full h-full">
                    <Image
                      src={previewUrl}
                      alt="Token preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                  {/* Image for small screens */}
                  <div className="md:hidden relative w-full h-full">
                    <Image
                      src={previewUrl}
                      alt="Token preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 z-10"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove image</span>
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm">
                    Drag and drop or click to upload
                  </span>
                </>
              )}
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
