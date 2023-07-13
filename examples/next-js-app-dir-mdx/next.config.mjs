import WithMDX from '@next/mdx'
import { remarkTableOfContents } from '../../dist/index.js'

const nextConfig = (/*phase*/) => {

    const withMDX = WithMDX({
        extension: /\.mdx?$/,
        options: {
            remarkPlugins: [[remarkTableOfContents, { 
                containerAttributes: { 
                    id: 'myCustomId',
                    class: ['myFirstCssClass', 'mySecondCssClass'],
                },
                navAttributes: {
                    'aria-label': 'table of contents'
                }
            }]],
            rehypePlugins: [],
        },
    })

    /** @type {import('next').NextConfig} */
    const nextConfig = {
        experimental: {
            appDir: true,
            mdxRs: false,
        },
        pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    }

    return withMDX(nextConfig)

}

export default nextConfig