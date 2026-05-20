import type { Request, Response, NextFunction } from 'express';

const roles = (allowedRoles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};

export default roles;
