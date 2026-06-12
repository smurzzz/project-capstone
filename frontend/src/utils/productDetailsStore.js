const PRODUCT_DETAILS_KEY = "jbm-product-details";
const DETAIL_FIELDS = ["specifications", "features", "compatibility", "warranty"];

const readStore = () => {
    try {
        return JSON.parse(localStorage.getItem(PRODUCT_DETAILS_KEY) || "{}");
    } catch {
        return {};
    }
};

const writeStore = (store) => {
    localStorage.setItem(PRODUCT_DETAILS_KEY, JSON.stringify(store));
};

const getStoreKeys = (product) => [
    product?._id,
    product?.productName ? `name:${product.productName}` : "",
].filter(Boolean);

const pickDetails = (product) => DETAIL_FIELDS.reduce((details, field) => {
    details[field] = String(product?.[field] || "");
    return details;
}, {});

export const saveProductDetails = (product) => {
    const keys = getStoreKeys(product);
    if (keys.length === 0) return;

    const store = readStore();
    const details = pickDetails(product);

    keys.forEach((key) => {
        store[key] = details;
    });

    writeStore(store);
};

export const mergeProductDetails = (product) => {
    if (!product) return product;

    const store = readStore();
    const storedDetails = getStoreKeys(product).reduce(
        (details, key) => ({ ...details, ...(store[key] || {}) }),
        {}
    );

    return {
        ...product,
        ...DETAIL_FIELDS.reduce((merged, field) => {
            merged[field] = product[field] || storedDetails[field] || "";
            return merged;
        }, {}),
    };
};

export const mergeProductsDetails = (products = []) => products.map(mergeProductDetails);
