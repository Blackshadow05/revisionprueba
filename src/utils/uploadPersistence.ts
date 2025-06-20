'use client';

interface UploadSession {
  id: string;
  timestamp: number;
  uploads: {
    id: string;
    fileName: string;
    recordId: string;
    fieldName: string;
    status: string;
  }[];
}

const STORAGE_KEY = 'upload_sessions';
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

export class UploadPersistence {
  static saveSession(uploads: any[]) {
    try {
      const sessions = this.getSessions();
      const sessionId = `session_${Date.now()}`;
      
      const newSession: UploadSession = {
        id: sessionId,
        timestamp: Date.now(),
        uploads: uploads.map(upload => ({
          id: upload.id,
          fileName: upload.fileName,
          recordId: upload.recordId,
          fieldName: upload.fieldName,
          status: upload.status
        }))
      };

      sessions.push(newSession);
      
      // Limpiar sesiones expiradas
      const validSessions = sessions.filter(
        session => Date.now() - session.timestamp < SESSION_EXPIRY
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(validSessions));
      return sessionId;
    } catch (error) {
      console.error('Error guardando sesión de subidas:', error);
      return null;
    }
  }

  static getSessions(): UploadSession[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const sessions = JSON.parse(stored);
      
      // Filtrar sesiones expiradas
      return sessions.filter(
        (session: UploadSession) => Date.now() - session.timestamp < SESSION_EXPIRY
      );
    } catch (error) {
      console.error('Error obteniendo sesiones:', error);
      return [];
    }
  }

  static getPendingUploads(): any[] {
    const sessions = this.getSessions();
    const pendingUploads: any[] = [];

    sessions.forEach(session => {
      session.uploads.forEach(upload => {
        if (upload.status === 'pending' || upload.status === 'uploading') {
          pendingUploads.push(upload);
        }
      });
    });

    return pendingUploads;
  }

  static markAsCompleted(uploadId: string) {
    try {
      const sessions = this.getSessions();
      let updated = false;

      sessions.forEach(session => {
        session.uploads.forEach(upload => {
          if (upload.id === uploadId) {
            upload.status = 'completed';
            updated = true;
          }
        });
      });

      if (updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error marcando como completado:', error);
    }
  }

  static markAsError(uploadId: string) {
    try {
      const sessions = this.getSessions();
      let updated = false;

      sessions.forEach(session => {
        session.uploads.forEach(upload => {
          if (upload.id === uploadId) {
            upload.status = 'error';
            updated = true;
          }
        });
      });

      if (updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error marcando como error:', error);
    }
  }

  static clearCompletedSessions() {
    try {
      const sessions = this.getSessions();
      const activeSessions = sessions.filter(session => 
        session.uploads.some(upload => 
          upload.status === 'pending' || upload.status === 'uploading'
        )
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeSessions));
    } catch (error) {
      console.error('Error limpiando sesiones:', error);
    }
  }

  static getSessionStats() {
    const sessions = this.getSessions();
    let pending = 0;
    let uploading = 0;
    let completed = 0;
    let error = 0;

    sessions.forEach(session => {
      session.uploads.forEach(upload => {
        switch (upload.status) {
          case 'pending': pending++; break;
          case 'uploading': uploading++; break;
          case 'completed': completed++; break;
          case 'error': error++; break;
        }
      });
    });

    return { pending, uploading, completed, error, total: pending + uploading + completed + error };
  }
} 