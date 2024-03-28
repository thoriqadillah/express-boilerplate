export function filetype(ext: string): string {
    ext = ext.replace('.', '')
    const images = ['jpg', 'jpeg', 'png', 'gif', 'bpm', 'webp']
    const videos = ['mp4', 'avi', 'wmv', 'mov', 'mkv']
    const docs = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt']
    const compressed = ['zip', 'rar', 'tar', '7z', 'gz']
    const audios = ['mp3', 'wav', 'ogg', 'flac', 'aac']

    if (images.includes(ext)) return 'image'
    if (videos.includes(ext)) return 'video'
    if (docs.includes(ext)) return 'document'
    if (compressed.includes(ext)) return 'compressed'
    if (audios.includes(ext)) return 'audio'

    return 'other'
}

export const KB = 1024
export const MB = KB * KB
export const GB = MB * KB

export function parseSize(size: number): string {
    if (size < KB) return (size / KB).toFixed(2) + " KB"
    if (size > KB && size < MB) return (size / KB).toFixed(2) + " KB"
    if (size > KB && size < GB) return (size / MB).toFixed(2) + " MB"
    if (size > GB) return (size / GB).toFixed(2) + " GB"
  
    return '0 KB'
  }