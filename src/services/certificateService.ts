interface CertificateGenerationData {
  template_id: string;
  data: {
    nombre_completo: string;
    nombre_producto: string;
  };
  recipient_name: string;
}

interface CertificateResponse {
  success: boolean;
  certificate: {
    id: string;
    download_url: string;
    view_url?: string;
  };
  message?: string;
}

class CertificateService {
  private readonly API_BASE_URL = 'https://certificados.automscc.com/api/certificates';
  private readonly TEMPLATE_ID = 'template-1750436089256';

  /**
   * Genera un certificado usando la API externa
   * @param studentName - Nombre completo del estudiante
   * @param courseName - Nombre del curso
   * @returns Promise con la respuesta del certificado
   */
  async generateCertificate(studentName: string, courseName: string): Promise<CertificateResponse> {
    try {
      // Primer paso: Generar el certificado
      const generatePayload: CertificateGenerationData = {
        template_id: this.TEMPLATE_ID,
        data: {
          nombre_completo: studentName,
          nombre_producto: courseName.toUpperCase()
        },
        recipient_name: studentName
      };

      console.log('Generating certificate with payload:', generatePayload);

      const generateResponse = await fetch(`${this.API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generatePayload)
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error('Certificate generation failed:', errorText);
        throw new Error(`Error al generar el certificado: ${generateResponse.status} - ${errorText}`);
      }

      const certificateData = await generateResponse.json();
      console.log('Certificate generation response:', certificateData);

      // Verificar que tengamos la URL de descarga
      if (!certificateData.certificate?.download_url) {
        throw new Error('No se recibió la URL de descarga del certificado');
      }

      // Segundo paso: Obtener el PDF del certificado
      const downloadResponse = await fetch(certificateData.certificate.download_url);
      
      if (!downloadResponse.ok) {
        console.error('Certificate download failed:', downloadResponse.status);
        throw new Error(`Error al descargar el certificado: ${downloadResponse.status}`);
      }

      return {
        success: true,
        certificate: {
          id: certificateData.certificate.id || Date.now().toString(),
          download_url: certificateData.certificate.download_url,
          view_url: certificateData.certificate.view_url
        }
      };

    } catch (error) {
      console.error('Error in certificate generation:', error);
      return {
        success: false,
        certificate: {
          id: '',
          download_url: ''
        },
        message: error instanceof Error ? error.message : 'Error desconocido al generar el certificado'
      };
    }
  }

  /**
   * Descarga un certificado dado su URL
   * @param downloadUrl - URL de descarga del certificado
   * @param fileName - Nombre del archivo para la descarga
   */
  async downloadCertificate(downloadUrl: string, fileName: string = 'certificado.pdf'): Promise<void> {
    try {
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Error al descargar: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading certificate:', error);
      throw new Error('Error al descargar el certificado');
    }
  }
}

export const certificateService = new CertificateService();
export type { CertificateResponse };