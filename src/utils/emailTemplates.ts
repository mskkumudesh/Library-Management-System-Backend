interface CheckoutEmailParams {
  memberName: string;
  bookTitle: string;
  bookAuthor: string;
  dueDate: Date;
}

export const checkoutConfirmationEmail = ({
  memberName,
  bookTitle,
  bookAuthor,
  dueDate,
}: CheckoutEmailParams) => ({
  subject: `You've checked out "${bookTitle}"`,
  html: `
    <div style="font-family: Georgia, serif; color: #1B2430; max-width: 480px;">
      <h2 style="color: #7A4B2E;">📖 ShelfScan</h2>
      <p>Hi ${memberName},</p>
      <p>You've successfully checked out:</p>
      <p style="font-size: 16px;">
        <strong>${bookTitle}</strong><br/>
        by ${bookAuthor}
      </p>
      <p>
        Please return it by
        <strong>${dueDate.toLocaleDateString()}</strong> to avoid a late fine.
      </p>
      <p style="color: #888; font-size: 12px; margin-top: 24px;">
        This is an automated message from ShelfScan Library System.
      </p>
    </div>
  `,
});

interface ReturnEmailParams {
  memberName: string;
  bookTitle: string;
  bookAuthor: string;
  returnedAt: Date;
  fineAmount: number;
}

export const returnConfirmationEmail = ({
  memberName,
  bookTitle,
  bookAuthor,
  returnedAt,
  fineAmount,
}: ReturnEmailParams) => ({
  subject: `"${bookTitle}" has been returned`,
  html: `
    <div style="font-family: Georgia, serif; color: #1B2430; max-width: 480px;">
      <h2 style="color: #7A4B2E;">📖 ShelfScan</h2>
      <p>Hi ${memberName},</p>
      <p>Thanks for returning:</p>
      <p style="font-size: 16px;">
        <strong>${bookTitle}</strong><br/>
        by ${bookAuthor}
      </p>
      <p>Returned on <strong>${returnedAt.toLocaleDateString()}</strong>.</p>
      ${
        fineAmount > 0
          ? `<p style="color: #c0392b;">
              A late fine of <strong>$${fineAmount.toFixed(2)}</strong> applies to this loan.
             </p>`
          : `<p style="color: #2F6F5E;">Returned on time — no fine. Thank you!</p>`
      }
      <p style="color: #888; font-size: 12px; margin-top: 24px;">
        This is an automated message from ShelfScan Library System.
      </p>
    </div>
  `,
});
