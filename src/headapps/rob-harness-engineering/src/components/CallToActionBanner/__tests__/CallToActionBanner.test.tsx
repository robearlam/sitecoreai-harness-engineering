import React from 'react';
import { render, screen } from '@testing-library/react';
import CallToActionBanner from '../CallToActionBanner';
import type { CallToActionBannerProps } from '../callToActionBannerTypes';

type F = { value?: Record<string, string> | string };

jest.mock('@sitecore-content-sdk/nextjs', () => {
  const ReactMock = jest.requireActual('react');
  // Mirrors SDK editing behaviour: empty fields render a placeholder span in editing mode.
  const editing = { current: false };
  return {
    __editing: editing,
    Text: ({ field, tag: Tag = 'span', id, className }: { field?: F; tag?: string; id?: string; className?: string }) => {
      const v = field?.value as string | undefined;
      if (!v && !editing.current) return null;
      return ReactMock.createElement(Tag, { id, className }, v || '[Heading placeholder]');
    },
    RichText: ({ field }: { field?: F }) => {
      const v = field?.value as string | undefined;
      if (!v && !editing.current) return null;
      return <div data-testid="body">{v || '[Body placeholder]'}</div>;
    },
    Link: ({ field, className }: { field?: F; className?: string }) => {
      const v = field?.value as { href?: string; text?: string } | undefined;
      if (v?.href) return <a href={v.href} className={className}>{v.text ?? v.href}</a>;
      return editing.current ? <span data-testid="link-placeholder" /> : null;
    },
    Image: ({ field, alt, className }: { field?: F; alt?: string; className?: string }) => {
      const v = field?.value as { src?: string; alt?: string } | undefined;
      if (v?.src) return <img src={v.src} alt={alt ?? v.alt ?? ''} className={className} />;
      return editing.current ? <span data-testid="image-placeholder" /> : null;
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sdk = require('@sitecore-content-sdk/nextjs') as { __editing: { current: boolean } };

function makeProps(
  fields: CallToActionBannerProps['fields'] = {},
  isEditing = false,
): CallToActionBannerProps {
  sdk.__editing.current = isEditing;
  return {
    fields: {
      Heading: { value: 'Get in touch' },
      Body: { value: 'We would love to hear from you.' },
      PrimaryAction: { value: { href: '/contact', text: 'Contact us' } },
      SecondaryAction: { value: { href: '/learn', text: 'Learn more' } },
      ...fields,
    },
    page: { mode: { isEditing } },
  } as unknown as CallToActionBannerProps;
}

const option = (value: string) => ({ id: '1', name: 'n', fields: { Value: { value } } });

describe('CallToActionBanner (normal mode)', () => {
  it('renders an h2, no h1, body and ordered links', () => {
    render(<CallToActionBanner {...makeProps()} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Get in touch');
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(screen.getByText('We would love to hear from you.')).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Contact us', 'Learn more']);
    expect(links[0]).toHaveAttribute('href', '/contact');
    expect(links[1]).toHaveAttribute('href', '/learn');
  });

  it('exposes a region named by its heading', () => {
    render(<CallToActionBanner {...makeProps()} />);
    expect(screen.getByRole('region', { name: 'Get in touch' })).toBeInTheDocument();
  });

  it('omits the secondary action when absent', () => {
    render(<CallToActionBanner {...makeProps({ SecondaryAction: { value: {} } })} />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it.each([[''], ['   ']])('omits body when empty (%j)', (v) => {
    render(<CallToActionBanner {...makeProps({ Body: { value: v } })} />);
    expect(screen.queryByTestId('body')).toBeNull();
  });

  it('omits the primary action without crashing, and both when empty', () => {
    const { unmount } = render(
      <CallToActionBanner {...makeProps({ PrimaryAction: { value: {} } })} />,
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link')).toHaveTextContent('Learn more');
    unmount();
    render(
      <CallToActionBanner
        {...makeProps({ PrimaryAction: { value: {} }, SecondaryAction: { value: {} } })}
      />,
    );
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('omits the heading and region name when the heading is empty', () => {
    render(<CallToActionBanner {...makeProps({ Heading: { value: '' } })} />);
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('defaults to neutral-light with no option selected', () => {
    const { container } = render(<CallToActionBanner {...makeProps()} />);
    expect(container.querySelector('section')).toHaveAttribute('data-background', 'neutral-light');
  });

  it.each(['neutral-light', 'primary', 'neutral-dark'])('renders %s mode', (v) => {
    const { container } = render(
      <CallToActionBanner {...makeProps({ BackgroundColour: option(v) })} />,
    );
    expect(container.querySelector('section')).toHaveAttribute('data-background', v);
  });

  it('uses image mode over a colour, with a decorative image', () => {
    const { container } = render(
      <CallToActionBanner
        {...makeProps({
          BackgroundColour: option('primary'),
          BackgroundImage: { value: { src: '/bg.jpg', alt: 'authored alt' } },
        })}
      />,
    );
    expect(container.querySelector('section')).toHaveAttribute('data-background', 'image');
    expect(screen.queryByRole('img')).toBeNull();
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
    expect(img?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByText('Background image')).toBeNull();
  });

  it('renders nothing when fields are absent', () => {
    const { container } = render(
      <CallToActionBanner {...({ page: { mode: { isEditing: false } } } as unknown as CallToActionBannerProps)} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('gives two banners distinct heading ids and own region names', () => {
    render(
      <>
        <CallToActionBanner {...makeProps({ Heading: { value: 'First' } })} />
        <CallToActionBanner {...makeProps({ Heading: { value: 'Second' } })} />
      </>,
    );
    const [a, b] = screen.getAllByRole('heading', { level: 2 });
    expect(a.id).not.toBe(b.id);
    expect(screen.getByRole('region', { name: 'First' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Second' })).toBeInTheDocument();
  });
});

describe('CallToActionBanner (editing mode)', () => {
  it('outputs every slot when fields are empty', () => {
    render(
      <CallToActionBanner
        {...makeProps(
          {
            Heading: { value: '' },
            Body: { value: '' },
            PrimaryAction: { value: {} },
            SecondaryAction: { value: {} },
          },
          true,
        )}
      />,
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getByTestId('body')).toBeInTheDocument();
    expect(screen.getAllByTestId('link-placeholder')).toHaveLength(2);
    expect(screen.getByText('Background image')).toBeInTheDocument();
    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();
  });

  it('shows the image in the slot as well as the band when set', () => {
    const { container } = render(
      <CallToActionBanner
        {...makeProps({ BackgroundImage: { value: { src: '/bg.jpg', alt: 'x' } } }, true)}
      />,
    );
    expect(container.querySelectorAll('img')).toHaveLength(2);
    expect(screen.getByText('Background image')).toBeInTheDocument();
  });
});
