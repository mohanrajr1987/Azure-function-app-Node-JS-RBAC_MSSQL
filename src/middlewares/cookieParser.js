import cookieParser from 'cookie-parser';

export const parseCookies = (req, res, next) => {
  // Get the cookie header from the request
  const cookies = req.headers.cookie;
  
  if (cookies) {
    // Parse the cookies
    req.cookies = cookieParser.JSONCookies(cookieParser.parse(cookies));
  } else {
    req.cookies = {};
  }
  
  next();
};
