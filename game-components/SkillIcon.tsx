import ProgressBar from "./ProgressBar";

type Props = {
  icon: string;
  level: any;
  action: any;
  style: string | null;
};

export default function SkillIcon({
  icon,
  level,
  action,
  style = "bg-red-800",
}: any) {
  return (
    <div className="pb-2 text-center">
      <p
        onClick={action}
        style={{
          opacity: level >= 100 ? "100%" : "20%",
          transition: "opacity 0.5s ease-in-out",
          cursor: "pointer",
          fontSize: "20px",
        }}
      >
        {icon}
      </p>
      <ProgressBar progress={level} style={style} />
    </div>
  );
}
