using Rozetka.Api.Models;

namespace Rozetka.Api.Data;

public static class ProductAssets
{
    public static string PrimaryImageUrl(string sku, string title) =>
        sku switch
        {
            "iphone-15-128-black" => "https://www.apple.com/v/iphone/home/cj/images/meta/iphone__bh930eyjnj0i_og.png?202605120906",
            "galaxy-s24-256" => "https://upload.wikimedia.org/wikipedia/commons/4/46/Samsung_Galaxy_S24_%28webtekno%29_008.png",
            "macbook-air-m3-13" => "https://www.apple.com/v/macbook-air/z/images/meta/macbook_air_mx__ez5y0k5yy7au_og.png?202605080834",
            "lenovo-legion-5" => "https://p3-ofp.static.pub//fes/cms/2025/12/23/1bkzaqo8wdrsxdiatq4hpq4vxiq82f191037.png?width=584&height=584",
            "sony-wh1000xm5" => "https://d1ncau8tqf99kp.cloudfront.net/converted/103364_original_local_1200x1050_v3_converted.webp",
            "ps5-slim" => "https://gmedia.playstation.com/is/image/SIEPDC/ps5-product-thumbnail-01-en-14sep21?$facebook$",
            "dyson-v15" => "https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/images/products/hero/400477-01.png",
            "anker-735" => "https://www.ankerjapan.com/cdn/shop/products/a2668_0001_A2668001_800x_cc40c8d5-f912-4679-9eb3-eaffa64f64ef_1200x1200.jpg?v=1662559209",
            _ => $"https://placehold.co/640x480/f5f7fb/1f2937?text={Uri.EscapeDataString(title)}"
        };

    public static IReadOnlyList<string> ImageUrls(Product product)
    {
        var urls = new[] { product.ImageUrl }
            .Concat(GalleryUrls(product.Sku))
            .Where(url => !string.IsNullOrWhiteSpace(url))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (urls.Count == 0)
        {
            urls.Add(PrimaryImageUrl(product.Sku, product.Title));
        }

        return urls;
    }

    private static IReadOnlyList<string> GalleryUrls(string sku) =>
        sku switch
        {
            "iphone-15-128-black" => new[]
            {
                "https://www.apple.com/newsroom/images/2023/09/apple-debuts-iphone-15-and-iphone-15-plus/article/Apple-iPhone-15-lineup-hero-230912_inline.jpg.large.jpg",
                "https://www.apple.com/newsroom/images/2023/09/apple-debuts-iphone-15-and-iphone-15-plus/article/Apple-iPhone-15-lineup-color-lineup-230912_big.jpg.large.jpg"
            },
            "galaxy-s24-256" => new[]
            {
                "https://cdn.movertix.com/media/catalog/product/cache/image/1200x/s/a/samsung-galaxy-s24-5g-onyx-black-128gb-and-8gb-ram-sm-s921b-front.jpg",
                "https://cdn.movertix.com/media/catalog/product/cache/image/1200x/s/a/samsung-galaxy-s24-5g-onyx-black-128gb-and-8gb-ram-sm-s921b-back.jpg",
                "https://cdn.movertix.com/media/catalog/product/cache/image/1200x/s/a/samsung-galaxy-s24-5g-onyx-black-128gb-and-8gb-ram-sm-s921b-side.jpg"
            },
            "macbook-air-m3-13" => new[]
            {
                "https://www.apple.com/newsroom/images/2024/03/apple-unveils-the-new-13-and-15-inch-macbook-air-with-the-powerful-m3-chip/article/Apple-MacBook-Air-2-up-hero-240304_big.jpg.large.jpg",
                "https://www.apple.com/newsroom/images/2024/03/apple-unveils-the-new-13-and-15-inch-macbook-air-with-the-powerful-m3-chip/article/Apple-MacBook-Air-lifestyle-240304_big.jpg.large.jpg",
                "https://www.apple.com/newsroom/images/2024/03/apple-unveils-the-new-13-and-15-inch-macbook-air-with-the-powerful-m3-chip/article/Apple-MacBook-Air-2-up-front-240304_big.jpg.large.jpg",
                "https://www.apple.com/newsroom/images/2024/03/apple-unveils-the-new-13-and-15-inch-macbook-air-with-the-powerful-m3-chip/article/Apple-MacBook-Air-keyboard-240304_big.jpg.large.jpg"
            },
            "lenovo-legion-5" => new[]
            {
                "https://psrefstuff.lenovo.com/syspool/Sys/Image/Legion/Legion_5_16IRX9/Legion_5_16IRX9_CT1_01.png",
                "https://psrefstuff.lenovo.com/syspool/Sys/Image/Legion/Legion_5_16IRX9/Legion_5_16IRX9_CT1_02.png",
                "https://psrefstuff.lenovo.com/syspool/Sys/Image/Legion/Legion_5_16IRX9/Legion_5_16IRX9_CT1_03.png",
                "https://psrefstuff.lenovo.com/syspool/Sys/Image/Legion/Legion_5_16IRX9/Legion_5_16IRX9_CT1_04.png"
            },
            "sony-wh1000xm5" => new[]
            {
                "https://media.ldlc.com/r1600/ld/products/00/06/00/23/LD0006002387.jpg",
                "https://media.ldlc.com/r1600/ld/products/00/06/00/24/LD0006002407.jpg",
                "https://media.ldlc.com/r1600/ld/products/00/06/00/23/LD0006002388.jpg"
            },
            "ps5-slim" => new[]
            {
                "https://youget.pt/248989-large_default/consola-sony-playstation-5-slim-standard-edition-2025-1tb.jpg",
                "https://youget.pt/248990-large_default/consola-sony-playstation-5-slim-standard-edition-2025-1tb.jpg",
                "https://youget.pt/248992-large_default/consola-sony-playstation-5-slim-standard-edition-2025-1tb.jpg"
            },
            "dyson-v15" => new[]
            {
                "https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/products/cord-free-vacuums/sticks/plp-cat-page-2024/Carousel/CatPage_PLP_Carousel_1.jpg",
                "https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/products/cord-free-vacuums/sticks/plp-cat-page-2024/Carousel/CatPage_PLP_Carousel_2.jpg",
                "https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/products/cord-free-vacuums/sticks/plp-cat-page-2024/Carousel/CatPage_PLP_Carousel_3.jpg"
            },
            "anker-735" => new[]
            {
                "https://m.media-amazon.com/images/I/5164giE9fFL._AC_SL1500_.jpg",
                "https://m.media-amazon.com/images/I/71Mckbirr2L._AC_SL1500_.jpg",
                "https://m.media-amazon.com/images/I/71w6e3NjyIL._AC_SL1500_.jpg",
                "https://m.media-amazon.com/images/I/615IMlOwcLL._AC_SL1500_.jpg"
            },
            _ => Array.Empty<string>()
        };
}
