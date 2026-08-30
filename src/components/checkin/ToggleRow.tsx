import { Switch } from "@/components/ui/switch";

export function ToggleRow({
  label,
  checked,
  onChange,
  activeClassName,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  activeClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onChange={onChange} activeClassName={activeClassName} />
    </div>
  );
}
