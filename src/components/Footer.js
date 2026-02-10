import React from 'react';
import { Box, Typography, styled } from '@mui/material';

const FooterContainer = styled(Box)(({ variant }) => ({
  position: 'fixed',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1000,
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 24px',
  background: variant === 'dark'
    ? 'rgba(20, 20, 20, 0.85)'
    : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '50px',
  border: `1px solid rgba(255, 140, 0, ${variant === 'dark' ? '0.3' : '0.2'})`,
  boxShadow: variant === 'dark'
    ? '0 4px 20px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(255, 140, 0, 0.2)'
    : '0 4px 20px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(255, 140, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: variant === 'dark'
      ? '0 6px 25px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(255, 140, 0, 0.3)'
      : '0 6px 25px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(255, 140, 0, 0.15)',
    transform: 'translateX(-50%) translateY(-2px)',
  },
}));

const DesignerText = styled(Typography)(({ variant }) => ({
  fontSize: '0.813rem',
  color: variant === 'dark' ? 'rgba(255, 140, 0, 0.6)' : 'rgba(0, 0, 0, 0.6)',
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontWeight: 400,
  letterSpacing: '0.02em',
}));

const DesignerLink = styled('a')(({ variant }) => ({
  fontSize: '0.813rem',
  color: '#ff8c00',
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontWeight: 600,
  letterSpacing: '0.02em',
  textDecoration: 'none',
  position: 'relative',
  transition: 'all 0.3s ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-2px',
    left: 0,
    width: '0%',
    height: '1.5px',
    background: 'linear-gradient(90deg, #ff6b00, #ff8c00)',
    transition: 'width 0.3s ease',
  },
  '&:hover': {
    color: variant === 'dark' ? '#ffa500' : '#ff6b00',
    transform: 'translateY(-1px)',
    '&::after': {
      width: '100%',
    },
  },
}));

const ArrowIcon = styled('span')({
  marginLeft: '4px',
  fontSize: '0.9rem',
  color: '#ff8c00',
  transition: 'transform 0.3s ease',
  display: 'inline-block',
});

const Footer = ({ variant = 'light' }) => {
  return (
    <FooterContainer variant={variant}>
      <DesignerText variant={variant}>Designed and created by</DesignerText>
      <DesignerLink
        variant={variant}
        href="https://www.prashanvitech.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Shrinidhi Katti
        <ArrowIcon>❯</ArrowIcon>
      </DesignerLink>
    </FooterContainer>
  );
};

export default Footer;
