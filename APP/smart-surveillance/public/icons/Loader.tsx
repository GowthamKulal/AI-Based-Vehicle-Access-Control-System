import React from "react";

const Loader = ({ ...props }: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 50 50"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={props.color || "#FFFFFF"}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="100"
        strokeDashoffset="60"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
};

export default Loader;
