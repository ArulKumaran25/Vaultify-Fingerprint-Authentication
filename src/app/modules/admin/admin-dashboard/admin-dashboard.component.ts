import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CouchdbService } from '../../../services/couchdb.service';
import { Router } from '@angular/router';
import * as d3 from 'd3';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  users: any[] = [];
  activityLogs: any[] = [];
  contactForms: any[] = [];

  showAllUsers = false;
  showAllLogs = false;
  showAllContacts = false;

  visibleUsers = 5;
  visibleLogs = 5;
  visibleContacts = 5;

  isReplyModalOpen = false;
  replyToEmail: string = '';
  replySubject: string = '';
  replyMessage: string = '';
  emailError: string = '';
  isSending: boolean = false; // Added this property
  includeTemplate: boolean = false; // Added this property
  
  loginCounts: any;
  selectedOption: string = 'users';

  constructor(
    private readonly couchdbService: CouchdbService,
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchUsers();
    this.fetchActivityLogs();
    this.fetchContactForms();
    this.fetchLoginCountsPerUser();
  }

  selectOption(option: string) {
    this.selectedOption = option;
  }

  ngAfterViewChecked() {
    this.renderContactChart();
    this.renderActivityChart();
    this.renderUserChart();
  }

  logout() {
    localStorage.removeItem('loggedUser');
    this.snackBar.open('Logged out successfully', 'Close', { 
      duration: 3000,
      panelClass: ['success-snackbar']
    });
    this.router.navigate(['/home']);
  }

  fetchUsers() {
    this.couchdbService.getAllRegisteredUser().subscribe(response => {
      if (response.rows) {
        this.users = response.rows.map((row: any) => ({
          name: row.value.name,
          email: row.value.email,
          timestamp: row.value.timestamp || row.value.registeredDate
        }));
        this.renderUserChart();
      }
    }, error => {
      console.error("Error fetching users:", error);
      this.snackBar.open('Error fetching users.', 'Close', { 
        duration: 3000, 
        panelClass: ['error-snackbar'] 
      });
    });
  }

  fetchActivityLogs() {
    this.couchdbService.getUserActivityLogs().subscribe(response => {
      if (response.rows) {
        this.activityLogs = response.rows.map((row: any) => row.value);
        this.renderActivityChart();
      }
    }, error => {
      console.error("Error fetching user activity logs:", error);
      this.snackBar.open('Error fetching activity logs.', 'Close', { 
        duration: 3000, 
        panelClass: ['error-snackbar'] 
      });
    });
  }

  fetchContactForms() {
    this.couchdbService.fetchContactForms().subscribe(response => {
      this.contactForms = response.rows.map((row: any) => ({
        name: row.value.name,
        email: row.value.email,
        message: row.value.message,
        timestamp: row.value.submittedDate || row.value.timestamp
      }));
      this.renderContactChart();
    }, error => {
      console.error("Error fetching contact forms:", error);
      this.snackBar.open('Error fetching contact forms.', 'Close', { 
        duration: 3000, 
        panelClass: ['error-snackbar'] 
      });
    });
  }

  fetchLoginCountsPerUser() {
    this.couchdbService.getLoginCountsPerUser().subscribe(response => {
      if (response.rows) {
        this.loginCounts = response.rows.map((row: any) => ({
          userId: row.key,
          count: row.value
        }));
      }
    }, error => {
      console.error("Error fetching login counts:", error);
      this.snackBar.open('Error fetching login counts.', 'Close', { 
        duration: 3000, 
        panelClass: ['error-snackbar'] 
      });
    });
  }

  renderUserChart() {
    d3.select('#userChart').selectAll('*').remove();
  
    // Process data - ensure proper date parsing
    const userDates = this.users.map(user => {
      const date = user.timestamp instanceof Date ? 
                   user.timestamp : 
                   new Date(user.timestamp);
      return date;
    });
  
    // Group by day with proper date formatting
    const userCounts = userDates.reduce((acc, date) => {
      const dateStr = date.toISOString().split('T')[0];
      acc[dateStr] = (acc[dateStr] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  
    // Convert to array and sort by date 
    const data = Object.keys(userCounts)
      .map(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return {
          date: new Date(year, month - 1, day),
          count: userCounts[dateStr]
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  
    if (data.length <= 1) {
      console.warn('Insufficient date variation to render chart');
      d3.select('#userChart')
        .append('text')
        .attr('x', 100)
        .attr('y', 50)
        .text('Not enough date variation to display chart');
      return;
    }
  
    // Chart dimensions
    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
  
    const svg = d3.select('#userChart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // Set up scales
    const x = d3.scaleTime()
      .domain([
        d3.min(data, d => d.date)!,
        d3.max(data, d => d.date)!
      ])
      .range([0, width]);
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count)! * 1.1])
      .range([height, 0]);
  
    // Add grid lines - CORRECTED VERSION
    svg.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(y)
          .tickSize(-width)
          .tickFormat('' as any)
      )
      .selectAll('.tick line')
      .attr('stroke-opacity', 0.2);
  
    // Create line generator
    const line = d3.line<{date: Date, count: number}>()
      .x(d => x(d.date))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);
  
    // Draw the line
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#806F40')
      .attr('stroke-width', 3)
      .attr('d', line);
  
    // Add data points
    svg.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.count))
      .attr('r', 5)
      .attr('fill', '#806F40')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('r', 8);
        
        const tooltip = svg.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${x(d.date)},${y(d.count)})`);
        
        tooltip.append('rect')
          .attr('x', -50)
          .attr('y', -30)
          .attr('width', 100)
          .attr('height', 25)
          .attr('fill', '#1e1e1e')
          .attr('rx', 5);
        
        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', -15)
          .text(`${d3.timeFormat('%b %d')(d.date)}: ${d.count}`);
      })
      .on('mouseout', () => {
        svg.selectAll('.dot').attr('r', 5);
        svg.selectAll('.tooltip').remove();
      });
  
    // Add X axis - CORRECTED VERSION
    const xAxis = d3.axisBottom(x)
      .ticks(d3.timeDay.every(1))
      .tickSizeOuter(0);
  
    const xAxisGroup = svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);
  
    xAxisGroup.selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform','rotate(-45)');
  
    // Add Y axis
    svg.append('g')
      .call(d3.axisLeft(y));
  
    // Add chart title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#eee')
      .text('User Registrations Over Time');
  }
  renderActivityChart() {
    const activityDates = this.activityLogs.map(log => new Date(log.timestamp).toLocaleDateString());
    const activityCounts = this.groupByDate(activityDates);

    const data = Object.keys(activityCounts).map(date => ({
      date,
      count: activityCounts[date]
    }));

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select('#activityChart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.date))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d: { count: any; }) => d.count)!])
      .nice()
      .range([height, 0]);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .call(d3.axisLeft(y));

    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d: { date: any; }) => x(d.date)!)
      .attr('y', (d: { count: any; }) => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', (d: { count: any; }) => height - y(d.count))
      .attr('fill', '#5C4B31');
  }

  renderContactChart() {
    const contactDates = this.contactForms.map(form => new Date(form.timestamp).toLocaleDateString());
    const contactCounts = this.groupByDate(contactDates);

    const data = Object.keys(contactCounts).map(date => ({
      date,
      count: contactCounts[date]
    }));

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select('#contactChart')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.date))
      .range(['#806F40', '#5C4B31', '#D5C4A1', '#E7DAC6']);

    const pie = d3.pie<any>()
      .value((d: { count: any; }) => d.count);

    const arc = d3.arc<any, d3.PieArcDatum<any>>()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = svg.selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d: { data: { date: string | number } }) => color(String(d.data.date)) as string);

    arcs.append('text')
      .attr('transform', (d: any) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .text((d: { data: { date: any; }; }) => d.data.date);
  }

  groupByDate(dates: string[]): { [key: string]: number } {
    return dates.reduce((acc, date) => {
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  toggleUsers() {
    this.showAllUsers = !this.showAllUsers;
    this.visibleUsers = this.showAllUsers ? this.users.length : 5;
  }

  toggleLogs() {
    this.showAllLogs = !this.showAllLogs;
    this.visibleLogs = this.showAllLogs ? this.activityLogs.length : 5;
  }

  toggleContacts() {
    this.showAllContacts = !this.showAllContacts;
    this.visibleContacts = this.showAllContacts ? this.contactForms.length : 5;
  }

  openReplyModal(email: string) {
    this.replyToEmail = email;
    this.isReplyModalOpen = true;
    this.emailError = '';
  }

  closeReplyModal() {
    this.isReplyModalOpen = false;
    this.replyToEmail = '';
    this.replySubject = '';
    this.replyMessage = '';
    this.emailError = '';
    this.isSending = false;
  }

  sendReply() {
    if (!this.replySubject.trim()) {
      this.emailError = 'Subject is required!';
      return;
    }
    if (!this.replyMessage.trim()) {
      this.emailError = 'Message cannot be empty!';
      return;
    }

    this.isSending = true;
    
    const emailData = {
      toEmail: this.replyToEmail,
      subject: this.replySubject,
      message: this.replyMessage,
      includeTemplate: this.includeTemplate
    };

    this.http.post('http://localhost:4000/send-email', emailData).subscribe(
      (response: any) => {
        this.isSending = false;
        if (response.success) {
          this.snackBar.open('Email sent successfully!', 'Close', { 
            duration: 3000, 
            panelClass: ['success-snackbar'] 
          });
          this.closeReplyModal();
        } else {
          this.emailError = response.message || 'Failed to send email';
          this.snackBar.open(this.emailError, 'Close', { 
            duration: 3000, 
            panelClass: ['error-snackbar'] 
          });
        }
      },
      (error) => {
        this.isSending = false;
        this.emailError = 'Failed to send email. Please try again.';
        this.snackBar.open(this.emailError, 'Close', { 
          duration: 3000, 
          panelClass: ['error-snackbar'] 
        });
        console.error('Error sending email:', error);
      }
    );
  }
}