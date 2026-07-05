namespace Rozetka.Api.Services;

public enum ImageFileFormat
{
    Unknown,
    Jpeg,
    Png,
    Gif,
    Bmp,
    Webp,
    Ico,
    Avif,
    Heic
}

public static class FileSignatureValidator
{
    /// <summary>
    /// Визначає реальний формат файлу за його бінарною сигнатурою (magic bytes),
    /// незалежно від того, що заявлено у Content-Type запиту.
    /// </summary>
    public static ImageFileFormat DetectFormat(Stream stream)
    {
        if (!stream.CanSeek)
        {
            throw new InvalidOperationException("Потік має підтримувати позиціонування (seekable).");
        }

        var originalPosition = stream.Position;
        try
        {
            Span<byte> header = stackalloc byte[16];
            var read = ReadExact(stream, header);
            if (read < 4)
            {
                return ImageFileFormat.Unknown;
            }

            // JPEG: FF D8 FF
            if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
            {
                return ImageFileFormat.Jpeg;
            }

            // PNG: 89 50 4E 47 0D 0A 1A 0A
            if (read >= 8 &&
                header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47 &&
                header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A)
            {
                return ImageFileFormat.Png;
            }

            // GIF: "GIF87a" або "GIF89a"
            if (read >= 6 &&
                header[0] == 'G' && header[1] == 'I' && header[2] == 'F' &&
                header[3] == '8' && (header[4] == '7' || header[4] == '9') && header[5] == 'a')
            {
                return ImageFileFormat.Gif;
            }

            // BMP: "BM"
            if (header[0] == 'B' && header[1] == 'M')
            {
                return ImageFileFormat.Bmp;
            }

            // ICO: 00 00 01 00
            if (read >= 4 &&
                header[0] == 0x00 && header[1] == 0x00 && header[2] == 0x01 && header[3] == 0x00)
            {
                return ImageFileFormat.Ico;
            }

            // WEBP: "RIFF" .... "WEBP"
            if (read >= 12 &&
                header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F' &&
                header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P')
            {
                return ImageFileFormat.Webp;
            }

            // AVIF / HEIC: ISO BMFF-контейнер, ftyp-бокс на офсеті 4,
            // бренд (major_brand) на офсеті 8.
            if (read >= 12 &&
                header[4] == 'f' && header[5] == 't' && header[6] == 'y' && header[7] == 'p')
            {
                var brand = System.Text.Encoding.ASCII.GetString(header.Slice(8, 4));
                if (brand is "avif" or "avis")
                {
                    return ImageFileFormat.Avif;
                }

                if (brand is "heic" or "heix" or "hevc" or "hevx" or "mif1" or "msf1")
                {
                    return ImageFileFormat.Heic;
                }
            }

            return ImageFileFormat.Unknown;
        }
        finally
        {
            stream.Position = originalPosition;
        }
    }

    private static int ReadExact(Stream stream, Span<byte> buffer)
    {
        var totalRead = 0;
        while (totalRead < buffer.Length)
        {
            var read = stream.Read(buffer.Slice(totalRead));
            if (read == 0)
            {
                break;
            }

            totalRead += read;
        }

        return totalRead;
    }
}