import { FunctionComponent } from "preact";

/** SVG back button shown to exit the settings view. */
const BACK_BUTTON = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="svg-icon lucide-arrow-left"
    >
        <path d="m12 19-7-7 7-7"></path>
        <path d="M19 12H5"></path>
    </svg>
);

type SettingsTitleProps = {
    title: string;
    description?: string;
    onClick?: () => void;
};

export const SettingsTitle: FunctionComponent<SettingsTitleProps> = (props) => {
    const { title, description, onClick } = props;
    return (
        <div className="dc-settings-title">
            <div className="dc-settings-title__content">
                <button className="clickable-icon" onClick={onClick}>
                    {BACK_BUTTON}
                </button>
                <h1 style={{ margin: "0 0 0 0.5rem" }}>{title}</h1>
                {description && <h2>{description}</h2>}
            </div>
            <div className="dc-horizontal-divider"/>
        </div>
    );
};
