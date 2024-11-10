import { FunctionComponent } from "preact";

type SettingsItemProps = {
    label: string;
    description?: string;
    contentBelow?: boolean;
};

export const SettingsItem: FunctionComponent<SettingsItemProps> = (props) => {
    const { label, description, contentBelow = false, children } = props;
    return (
        <div className={`dc-settings-item ${contentBelow ? `dc-flex-column` : ``}`}>
            <div className={`dc-settings-item__label`}>
                <h2>{label}</h2>
                <small>{description}</small>
            </div>
            {children}
        </div>
    );
};
