import { Global } from "@emotion/react/";

const Fonts = () => (
    <Global
        styles={
            `@font-face {
                font-family: 'Pirulen';
                src: url("../pirulen/pirulen.otf/") format("opentype");
            }`
        }
    />
)

export default Fonts;