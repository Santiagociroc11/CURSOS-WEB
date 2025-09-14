// Sistema de shortcodes para crear botones y elementos de forma sencilla

export interface ShortcodeConfig {
  tag: string;
  attributes: string[];
  selfClosing?: boolean;
  defaultClass?: string;
  action?: string;
}

export const shortcodeConfigs: ShortcodeConfig[] = [
  {
    tag: 'button',
    attributes: ['link', 'style', 'class'],
    defaultClass: 'btn-primary',
    action: 'open-link'
  },
  {
    tag: 'download',
    attributes: ['url', 'style', 'class'],
    defaultClass: 'btn-success',
    action: 'download'
  },
  {
    tag: 'alert',
    attributes: ['message', 'style', 'class'],
    defaultClass: 'btn-warning',
    action: 'alert'
  },
  {
    tag: 'link',
    attributes: ['url', 'style', 'class'],
    selfClosing: false
  }
];

export class ShortcodeProcessor {
  
  /**
   * Convierte shortcodes a HTML funcional
   */
  static process(content: string): string {
    let processedContent = content;
    
    // Procesar cada tipo de shortcode
    shortcodeConfigs.forEach(config => {
      processedContent = this.processShortcode(processedContent, config);
    });
    
    return processedContent;
  }
  
  private static processShortcode(content: string, config: ShortcodeConfig): string {
    const { tag, attributes, selfClosing, defaultClass, action } = config;
    
    if (selfClosing) {
      // Para shortcodes auto-cerrados como [link url="..."/]
      const regex = new RegExp(`\\[${tag}([^\\]]*?)\\s*\\/\\]`, 'gi');
      return content.replace(regex, (match, attributesStr) => {
        const attrs = this.parseAttributes(attributesStr);
        return this.generateElement(tag, attrs, '', config);
      });
    } else {
      // Para shortcodes con contenido como [button link="..."]Texto[/button]
      const regex = new RegExp(`\\[${tag}([^\\]]*?)\\]([\\s\\S]*?)\\[\\/${tag}\\]`, 'gi');
      return content.replace(regex, (match, attributesStr, innerContent) => {
        const attrs = this.parseAttributes(attributesStr);
        return this.generateElement(tag, attrs, innerContent.trim(), config);
      });
    }
  }
  
  private static parseAttributes(attributesStr: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const regex = /(\w+)=["']([^"']*?)["']/g;
    let match;
    
    while ((match = regex.exec(attributesStr)) !== null) {
      attrs[match[1]] = match[2];
    }
    
    return attrs;
  }
  
  private static generateElement(
    tag: string, 
    attrs: Record<string, string>, 
    content: string, 
    config: ShortcodeConfig
  ): string {
    const { defaultClass, action } = config;
    
    switch (tag) {
      case 'button':
      case 'download':
      case 'alert':
        return this.generateButton(attrs, content, action!, defaultClass!);
      
      case 'link':
        return this.generateLink(attrs, content);
      
      default:
        return `<!-- Shortcode no reconocido: ${tag} -->`;
    }
  }
  
  private static generateButton(
    attrs: Record<string, string>, 
    content: string, 
    action: string, 
    defaultClass: string
  ): string {
    const url = attrs.link || attrs.url || attrs.message || '#';
    const cssClass = attrs.class || defaultClass;
    const style = attrs.style || '';
    
    const styleAttr = style ? ` style="${style}"` : '';
    
    return `<button data-action="${action}" data-url="${url}" class="${cssClass}"${styleAttr}>${content}</button>`;
  }
  
  private static generateLink(attrs: Record<string, string>, content: string): string {
    const url = attrs.url || '#';
    const cssClass = attrs.class || '';
    const style = attrs.style || '';
    
    const classAttr = cssClass ? ` class="${cssClass}"` : '';
    const styleAttr = style ? ` style="${style}"` : '';
    
    return `<a href="${url}" target="_blank" rel="noopener noreferrer"${classAttr}${styleAttr}>${content}</a>`;
  }
  
  /**
   * Obtiene una lista de shortcodes disponibles para autocompletado
   */
  static getAvailableShortcodes(): Array<{
    tag: string;
    description: string;
    example: string;
    category: string;
  }> {
    return [
      {
        tag: 'button',
        description: 'Botón que abre un enlace externo',
        example: '[button link="https://ejemplo.com"]Visitar Sitio[/button]',
        category: 'Interactivo'
      },
      {
        tag: 'download',
        description: 'Botón para descargar archivos',
        example: '[download url="archivo.pdf"]Descargar PDF[/download]',
        category: 'Interactivo'
      },
      {
        tag: 'alert',
        description: 'Botón que muestra un mensaje',
        example: '[alert message="¡Hola!"]Mostrar Saludo[/alert]',
        category: 'Interactivo'
      },
      {
        tag: 'link',
        description: 'Enlace que se abre en nueva pestaña',
        example: '[link url="https://ejemplo.com"]Texto del enlace[/link]',
        category: 'Navegación'
      }
    ];
  }
  
  /**
   * Obtiene estilos disponibles para botones
   */
  static getAvailableStyles(): Array<{
    name: string;
    class: string;
    description: string;
  }> {
    return [
      { name: 'Primario', class: 'btn-primary', description: 'Azul principal' },
      { name: 'Secundario', class: 'btn-secondary', description: 'Gris secundario' },
      { name: 'Éxito', class: 'btn-success', description: 'Verde de éxito' },
      { name: 'Advertencia', class: 'btn-warning', description: 'Amarillo de advertencia' },
      { name: 'Peligro', class: 'btn-danger', description: 'Rojo de peligro' },
      { name: 'Contorno', class: 'btn-outline', description: 'Botón con borde' }
    ];
  }
}
