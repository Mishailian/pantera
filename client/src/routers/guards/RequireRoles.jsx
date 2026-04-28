import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export const RequireRoles = ({ allowedRoles, children }) => {
  const roles = useSelector((state) => state.auth.roles ?? []);
  const roleNames = roles.map((role) => role.name);

  const hasAccess = allowedRoles.some((role) => roleNames.includes(role));

  if (!hasAccess) {
    return <Navigate to="/profile" replace />;
  }

  return children;
};