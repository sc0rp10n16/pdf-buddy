/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        return config;
    },
    images: {
        domains: ["i.imgur.com", "img.clerk.com"],
        dangerouslyAllowSVG: true
    }
};

export default nextConfig;
