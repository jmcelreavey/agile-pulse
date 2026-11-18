import { type NextRequest } from "next/server";
import {
  EmailTemplateService,
  type ChangelogEmailData,
  type InvitationEmailData,
} from "~/server/email/EmailTemplateService";

// Preview email template for development/testing
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "html";
  const template = searchParams.get("template") || "changelog";

  try {
    if (template === "invitation") {
      // Sample invitation data for new customer
      const sampleInvitationData: InvitationEmailData = {
        customerEmail: "john.smith@example.com",
        projectName: "E-Commerce Platform",
        invitedByName: "Sarah Johnson",
        invitationUrl: "https://agilepulse.dev/customer/register/abc123token",
        isExistingCustomer: false,
        expirationDays: 7,
      };

      if (format === "text") {
        const textContent =
          EmailTemplateService.generateInvitationEmailText(
            sampleInvitationData
          );
        return new Response(textContent, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      } else {
        const htmlContent =
          EmailTemplateService.generateInvitationEmailHtml(
            sampleInvitationData
          );
        return new Response(htmlContent, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        });
      }
    } else if (template === "invitation-existing") {
      // Sample invitation data for existing customer
      const sampleInvitationData: InvitationEmailData = {
        customerEmail: "jane.doe@example.com",
        projectName: "Mobile Banking App",
        invitedByName: "Mike Wilson",
        invitationUrl: "https://agilepulse.dev/customer/accept/xyz789token",
        isExistingCustomer: true,
        expirationDays: 7,
      };

      if (format === "text") {
        const textContent =
          EmailTemplateService.generateInvitationEmailText(
            sampleInvitationData
          );
        return new Response(textContent, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      } else {
        const htmlContent =
          EmailTemplateService.generateInvitationEmailHtml(
            sampleInvitationData
          );
        return new Response(htmlContent, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        });
      }
    } else {
      // Sample changelog data (default)
      const sampleChangelogData: ChangelogEmailData = {
        projectName: "E-Commerce Platform",
        sprintName: "Sprint 23",
        changelogContent: `
          <h2>🚀 New Features</h2>
          <ul>
            <li><strong>Enhanced Product Search</strong> - Implemented advanced filtering options including price range, brand, and customer ratings</li>
            <li><strong>Wishlist Functionality</strong> - Users can now save products to their wishlist for later purchase</li>
            <li><strong>Mobile App Performance</strong> - Optimized loading times by 40% through improved caching strategies</li>
          </ul>

          <h2>🐛 Bug Fixes</h2>
          <ul>
            <li>Fixed checkout process hanging on payment processing</li>
            <li>Resolved issue with product images not loading on slower connections</li>
            <li>Corrected inventory count display in product listings</li>
          </ul>

          <h2>🔧 Improvements</h2>
          <ul>
            <li><strong>User Dashboard</strong> - Redesigned order history section with better navigation</li>
            <li><strong>Admin Panel</strong> - Added bulk product editing capabilities</li>
            <li><strong>Security Updates</strong> - Enhanced data encryption and user authentication</li>
          </ul>

          <h2>📈 Performance Metrics</h2>
          <ul>
            <li>Page load time improved from 3.2s to 1.9s</li>
            <li>Cart abandonment rate decreased by 15%</li>
            <li>Mobile responsiveness score increased to 98/100</li>
          </ul>
        `,
        customerName: "John Smith",
        generateDate: "December 15, 2024",
        sharedDate: "December 15, 2024",
      };

      if (format === "text") {
        const textContent =
          EmailTemplateService.generateChangelogEmailText(sampleChangelogData);
        return new Response(textContent, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      } else {
        const htmlContent =
          EmailTemplateService.generateChangelogEmailHtml(sampleChangelogData);
        return new Response(htmlContent, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        });
      }
    }
  } catch (error) {
    console.error("Error generating email template:", error);
    return new Response("Error generating email template", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
