import React from 'react';
import { Box, Typography, styled } from '@mui/material';

const FooterContainer = styled(Box)({
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '20px 24px',
  borderTop: '1px solid rgba(255, 140, 0, 0.1)',
  mt: 4,
});

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

const Footer = ({ dark }) => {
  return (
    <FooterContainer>
      <DesignerText variant={dark ? 'dark' : 'light'}>Designed and created by</DesignerText>
      <DesignerLink
        variant={dark ? 'dark' : 'light'}
        href="https://www.prashanvitech.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        PrashanviTech
        <ArrowIcon>❯</ArrowIcon>
      </DesignerLink>
    </FooterContainer>
  );
};

export default Footer;
