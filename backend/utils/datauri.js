import DataUriParser from "datauri";
import path from "path";

const parser = new DataUriParser();

export const getDataUri = (file) => {
    const extName = path.extname(file.originalname).toString();
    const file64 = parser.format(extName, file.buffer);

    return file64.content;
};

export default getDataUri;
